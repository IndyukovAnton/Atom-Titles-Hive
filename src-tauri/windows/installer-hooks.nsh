; Backend-sidecar (backend-x86_64-pc-windows-msvc.exe) переживает основное
; приложение и держит файлы в каталоге установки заблокированными — без этого
; NSIS не может заменить исполняемые файлы при обновлении/удалении.
; Особенно критично для обновлений со старых версий, чьё приложение не гасит
; backend самостоятельно: код новой версии тут ещё не запущен, помочь может
; только инсталлер.
!macro NSIS_HOOK_PREINSTALL
  nsExec::ExecToStack 'taskkill /F /T /IM backend-x86_64-pc-windows-msvc.exe'
  Pop $0 ; exit code (128/1 = процесс не найден — это нормально, игнорируем)
  Pop $1 ; output
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  nsExec::ExecToStack 'taskkill /F /T /IM backend-x86_64-pc-windows-msvc.exe'
  Pop $0
  Pop $1
!macroend
