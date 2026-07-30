//! Гарантия смерти sidecar вместе с родителем.
//!
//! Windows: Job Object с `KILL_ON_JOB_CLOSE` — при любом выходе `app.exe`
//! (crash, updater, taskkill) ОС закрывает хэндл Job и убивает всё дерево
//! sidecar, включая потомков (CLI-агенты). Без этого `child.kill()` в
//! `RunEvent::Exit` может не успеть — сироты копятся и держат image-лок
//! на `backend.exe`, ломая авто-обновление.
//!
//! Не-Windows: no-op (Unix и так убивает детей при смерти родителя, если
//! процесс не был detach'нут).

#[cfg(windows)]
mod windows_impl {
    use std::io;
    use std::mem::{size_of, zeroed};

    use windows_sys::Win32::Foundation::{CloseHandle, FALSE, HANDLE, INVALID_HANDLE_VALUE};
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
        SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    };
    use windows_sys::Win32::System::Threading::{
        OpenProcess, PROCESS_SET_QUOTA, PROCESS_TERMINATE,
    };

    /// Живой хэндл Job Object. `Drop` → CloseHandle → Windows убивает дерево.
    pub struct ProcessJob {
        handle: HANDLE,
    }

    // HANDLE — указатель на kernel object; CloseHandle ровно один раз в Drop.
    unsafe impl Send for ProcessJob {}
    unsafe impl Sync for ProcessJob {}

    impl ProcessJob {
        /// Создаёт Job с `KILL_ON_JOB_CLOSE` и назначает в него процесс `pid`.
        /// Потомки этого процесса автоматически попадают в тот же Job.
        pub fn create_for(pid: u32) -> io::Result<Self> {
            unsafe {
                let job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
                if job.is_null() || job == INVALID_HANDLE_VALUE {
                    return Err(io::Error::last_os_error());
                }

                let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = zeroed();
                info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
                let ok = SetInformationJobObject(
                    job,
                    JobObjectExtendedLimitInformation,
                    &info as *const _ as *const _,
                    size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
                );
                if ok == 0 {
                    let err = io::Error::last_os_error();
                    CloseHandle(job);
                    return Err(err);
                }

                // AssignProcessToJobObject требует PROCESS_SET_QUOTA | PROCESS_TERMINATE.
                let process = OpenProcess(PROCESS_SET_QUOTA | PROCESS_TERMINATE, FALSE, pid);
                if process.is_null() {
                    let err = io::Error::last_os_error();
                    CloseHandle(job);
                    return Err(err);
                }

                let assigned = AssignProcessToJobObject(job, process);
                CloseHandle(process);
                if assigned == 0 {
                    let err = io::Error::last_os_error();
                    CloseHandle(job);
                    return Err(err);
                }

                Ok(Self { handle: job })
            }
        }
    }

    impl Drop for ProcessJob {
        fn drop(&mut self) {
            if !self.handle.is_null() && self.handle != INVALID_HANDLE_VALUE {
                unsafe {
                    CloseHandle(self.handle);
                }
                self.handle = std::ptr::null_mut();
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use std::process::Command;
        use std::time::{Duration, Instant};

        #[test]
        fn create_for_invalid_pid_errors() {
            assert!(
                ProcessJob::create_for(0xFFFF_FFFE).is_err(),
                "несуществующий pid должен давать ошибку"
            );
        }

        #[test]
        fn drop_kills_assigned_process() {
            let mut child = Command::new("cmd.exe")
                .args(["/C", "ping -n 30 127.0.0.1 > nul"])
                .spawn()
                .expect("spawn cmd.exe");

            let job = ProcessJob::create_for(child.id()).expect("create job");
            drop(job);

            let deadline = Instant::now() + Duration::from_secs(3);
            loop {
                match child.try_wait().expect("try_wait") {
                    Some(_) => break,
                    None if Instant::now() >= deadline => {
                        let _ = child.kill();
                        panic!("процесс пережил Drop ProcessJob дольше 3с");
                    }
                    None => std::thread::sleep(Duration::from_millis(50)),
                }
            }
        }
    }
}

#[cfg(not(windows))]
mod stub_impl {
    use std::io;

    pub struct ProcessJob;

    impl ProcessJob {
        pub fn create_for(_pid: u32) -> io::Result<Self> {
            Ok(Self)
        }
    }
}

#[cfg(windows)]
pub use windows_impl::ProcessJob;
#[cfg(not(windows))]
pub use stub_impl::ProcessJob;
