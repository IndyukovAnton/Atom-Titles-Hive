; Backend-sidecar ставится в $INSTDIR под именем backend.exe (см. /oname в
; шаблоне NSIS) и переживает основное приложение: старые версии не гасят его
; при обновлении. Пока файл кем-то открыт без share-write (живой процесс,
; AV-сканер и т.п.), NSIS не может его перезаписать — обновление ломается.
;
; Порядок важен: сначала гасим app.exe — он держит открытые хэндлы на свои
; backend-процессы, и Windows не отпускает image-лок backend.exe, пока
; родитель жив. Затем гасим backend-сироты. Имена общие (app.exe/backend.exe),
; поэтому фильтруем по пути $INSTDIR.
; Зависшие backend-процессы могут быть зомби: для них Get-Process -Name
; молча возвращает пустоту (запрос имени падает). Поэтому перечисляем
; процессы через CIM (имена читаются из ядра) и убиваем по PID.
; Имена общие (app.exe/backend.exe) — фильтруем по пути $INSTDIR.
; (В NSIS-строке $$ — литеральный $, \" — кавычка, \\ — бэкслеш.)
!macro _SeenKillRunningProcesses
  nsExec::ExecToStack "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Get-CimInstance Win32_Process | Where-Object { ($$_.Name -eq 'backend.exe' -or $$_.Name -eq 'app.exe') -and $$_.ExecutablePath -like '$INSTDIR\\*' } | ForEach-Object { Stop-Process -Id $$_.ProcessId -Force -ErrorAction SilentlyContinue }\""
  Pop $R0 ; exit code (процессы не найдены — нормально, игнорируем)
  Pop $R1 ; output
  Sleep 500 ; даём ОС отпустить файловые хэндлы
!macroend

!macro NSIS_HOOK_PREINSTALL
  !insertmacro _SeenKillRunningProcesses

  ; Даже без живых процессов файл может оставаться недоступным для
  ; удаления/перезаписи (Access Denied): сторонний хэндл с share-delete,
  ; но без share-write (наблюдалось на 0.4.x). Rename при таком локе
  ; РАБОТАЕТ — уводим файл в сторону, и File дальше пишет новый начисто.
  ${If} ${FileExists} "$INSTDIR\backend.exe"
    StrCpy $R2 0
    ${Do}
      Delete "$INSTDIR\backend.exe"
      ${IfNot} ${FileExists} "$INSTDIR\backend.exe"
        ${ExitDo}
      ${EndIf}
      IntOp $R2 $R2 + 1
      ${If} $R2 >= 4
        ${ExitDo}
      ${EndIf}
      Sleep 500
    ${Loop}
  ${EndIf}

  ${If} ${FileExists} "$INSTDIR\backend.exe"
    ; Не удалился — переименовываем; остаток удаляем сейчас или при ребуте.
    Delete /rebootok "$INSTDIR\backend.old"
    Rename "$INSTDIR\backend.exe" "$INSTDIR\backend.old"
    Delete /rebootok "$INSTDIR\backend.old"
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro _SeenKillRunningProcesses
!macroend
