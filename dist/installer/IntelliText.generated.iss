#define MyAppName "IntelliText"
#define MyAppVersion "0.1.0"
#define SourceDir "C:\\\\Users\\\\suhaib\\\\Desktop\\\\personal-ai-assistant\\\\dist\\\\preview"
#define OutputDir "C:\\\\Users\\\\suhaib\\\\Desktop\\\\personal-ai-assistant\\\\dist\\\\installer"

[Setup]
AppId={{4A7B2F4E-1C43-4A6B-9F93-8E5A1D7E5D4B}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={autopf}\IntelliText
DefaultGroupName=IntelliText
OutputDir={#OutputDir}
OutputBaseFilename=IntelliText-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
DisableProgramGroupPage=no

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"

[Dirs]
Name: "{app}\logs"
Name: "{app}\data"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{autoprograms}\IntelliText"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\launch-app.ps1"" -Mode preview"
Name: "{autodesktop}\IntelliText"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\launch-app.ps1"" -Mode preview"; Tasks: desktopicon

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\launch-app.ps1"" -Mode preview"; Description: "Launch IntelliText"; Flags: nowait postinstall skipifsilent

