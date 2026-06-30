using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace IntelliTextHost
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new ShellForm());
        }
    }

    internal sealed class ShellForm : Form
    {
        private readonly string rootDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
        private readonly string frontendUrl = "http://127.0.0.1:3000";
        private readonly string ollamaUrl = "http://127.0.0.1:11435";
        private readonly string userDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "IntelliText", "WebView2");
        private readonly string processStatePath;
        private readonly List<Process> childProcesses = new List<Process>();
        private readonly WebView2 webView = new WebView2();
        private readonly Panel overlay = new Panel();
        private readonly Label statusLabel = new Label();
        private readonly Label detailLabel = new Label();
        private readonly Button retryButton = new Button();
        private bool startupTriggered;
        private Process ollamaProcess;
        private Process backendProcess;
        private Process frontendProcess;

        public ShellForm()
        {
            processStatePath = Path.Combine(rootDir, "logs", "app.pids.json");
            Text = "IntelliText";
            StartPosition = FormStartPosition.CenterScreen;
            WindowState = FormWindowState.Maximized;
            MinimumSize = new Size(1200, 800);
            BackColor = Color.FromArgb(14, 15, 18);
            FormBorderStyle = FormBorderStyle.Sizable;

            webView.Dock = DockStyle.Fill;
            webView.Visible = false;
            Controls.Add(webView);

            overlay.Dock = DockStyle.Fill;
            overlay.BackColor = Color.FromArgb(18, 19, 24);
            Controls.Add(overlay);
            overlay.BringToFront();

            Panel card = new Panel();
            card.Size = new Size(520, 220);
            card.BackColor = Color.FromArgb(28, 30, 36);
            card.Padding = new Padding(28);
            card.BorderStyle = BorderStyle.FixedSingle;
            card.Anchor = AnchorStyles.None;
            overlay.Controls.Add(card);

            statusLabel.AutoSize = false;
            statusLabel.Dock = DockStyle.Top;
            statusLabel.Height = 56;
            statusLabel.Font = new Font("Segoe UI", 18f, FontStyle.Bold);
            statusLabel.ForeColor = Color.White;
            statusLabel.Text = "Starting IntelliText";
            card.Controls.Add(statusLabel);

            detailLabel.AutoSize = false;
            detailLabel.Dock = DockStyle.Top;
            detailLabel.Height = 72;
            detailLabel.Font = new Font("Segoe UI", 10f, FontStyle.Regular);
            detailLabel.ForeColor = Color.FromArgb(185, 190, 200);
            detailLabel.Text = "Launching the bundled Ollama runtime, backend, and frontend...";
            card.Controls.Add(detailLabel);

            retryButton.Text = "Retry";
            retryButton.Visible = false;
            retryButton.Size = new Size(120, 38);
            retryButton.FlatStyle = FlatStyle.Flat;
            retryButton.BackColor = Color.FromArgb(64, 78, 255);
            retryButton.ForeColor = Color.White;
            retryButton.Anchor = AnchorStyles.Bottom | AnchorStyles.Right;
            retryButton.Location = new Point(card.Width - retryButton.Width - 28, card.Height - retryButton.Height - 28);
            retryButton.Click += delegate { BeginStartup(); };
            card.Controls.Add(retryButton);

            overlay.Resize += delegate
            {
                card.Left = (overlay.ClientSize.Width - card.Width) / 2;
                card.Top = (overlay.ClientSize.Height - card.Height) / 2;
            };

            Shown += delegate
            {
                if (!startupTriggered)
                {
                    startupTriggered = true;
                    BeginStartup();
                }
            };

            FormClosing += ShellForm_FormClosing;
        }

        private async void BeginStartup()
        {
            retryButton.Visible = false;
            SetStatus("Starting IntelliText", "Launching the bundled Ollama runtime, backend, and frontend...");

            try
            {
                CleanupExistingRuntime();
                StartBundledRuntime();
                WriteProcessState();
                await WaitForEndpointAsync(frontendUrl, TimeSpan.FromSeconds(120));
                await InitializeWebViewAsync();
                webView.CoreWebView2.Navigate(frontendUrl);
                webView.Visible = true;
                overlay.Visible = false;
                WriteProcessState();
                Text = "IntelliText";
            }
            catch (Exception ex)
            {
                webView.Visible = false;
                overlay.Visible = true;
                SetStatus("Could not start IntelliText", ex.Message);
                retryButton.Visible = true;
            }
        }

        private void StartBundledRuntime()
        {
            ollamaProcess = StartOllamaProcess();
            backendProcess = StartBackendProcess();
            frontendProcess = StartFrontendProcess();
        }

        private Process StartOllamaProcess()
        {
            string bundledExe = Path.Combine(rootDir, "ollama", "ollama.exe");
            string exePath = File.Exists(bundledExe) ? bundledExe : "ollama";

            ProcessStartInfo psi = new ProcessStartInfo(exePath, "serve");
            ConfigureProcessStartInfo(psi, rootDir);
            psi.EnvironmentVariables["OLLAMA_HOST"] = ollamaUrl;
            psi.EnvironmentVariables["OLLAMA_MODELS"] = Path.Combine(rootDir, "models");

            return StartLoggedProcess(psi, "ollama");
        }

        private Process StartBackendProcess()
        {
            string bundledPython = Path.Combine(rootDir, ".venv", "Scripts", "python.exe");
            string exePath = File.Exists(bundledPython) ? bundledPython : "python";

            ProcessStartInfo psi = new ProcessStartInfo(
                exePath,
                "-m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000");
            ConfigureProcessStartInfo(psi, rootDir);
            psi.EnvironmentVariables["OLLAMA_BASE_URL"] = ollamaUrl;

            return StartLoggedProcess(psi, "backend");
        }

        private Process StartFrontendProcess()
        {
            string bundledNode = Path.Combine(rootDir, "node.exe");
            string exePath = File.Exists(bundledNode) ? bundledNode : "node";

            ProcessStartInfo psi = new ProcessStartInfo(exePath, "frontend/server.js");
            ConfigureProcessStartInfo(psi, rootDir);

            return StartLoggedProcess(psi, "frontend");
        }

        private async Task InitializeWebViewAsync()
        {
            string bundledRuntime = Path.Combine(rootDir, "webview2-runtime");
            string browserExecutableFolder = Directory.Exists(bundledRuntime) ? bundledRuntime : null;
            CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(
                browserExecutableFolder,
                userDataDir,
                null);
            await webView.EnsureCoreWebView2Async(environment);
        }

        private void ConfigureProcessStartInfo(ProcessStartInfo psi, string workingDirectory)
        {
            psi.WorkingDirectory = workingDirectory;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.RedirectStandardOutput = true;
            psi.RedirectStandardError = true;
        }

        private Process StartLoggedProcess(ProcessStartInfo psi, string name)
        {
            Process process = new Process();
            process.StartInfo = psi;
            process.OutputDataReceived += delegate(object sender, DataReceivedEventArgs args)
            {
                if (!string.IsNullOrWhiteSpace(args.Data))
                {
                    AppendLog(name, args.Data);
                }
            };
            process.ErrorDataReceived += delegate(object sender, DataReceivedEventArgs args)
            {
                if (!string.IsNullOrWhiteSpace(args.Data))
                {
                    AppendLog(name + ".err", args.Data);
                }
            };

            if (!process.Start())
            {
                throw new InvalidOperationException("Could not start " + name + ".");
            }

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            childProcesses.Add(process);
            return process;
        }

        private void CleanupExistingRuntime()
        {
            string stopScript = Path.Combine(rootDir, "stop-app.ps1");
            if (!File.Exists(stopScript))
            {
                return;
            }

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo(
                    "powershell.exe",
                    "-ExecutionPolicy Bypass -WindowStyle Hidden -File \"" + stopScript + "\" -Mode all -RootPath \"" + rootDir + "\"");
                psi.WorkingDirectory = rootDir;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;

                using (Process cleanup = Process.Start(psi))
                {
                    if (cleanup != null)
                    {
                        cleanup.WaitForExit(10000);
                    }
                }
            }
            catch
            {
                // Best effort cleanup.
            }
        }

        private void WriteProcessState()
        {
            try
            {
                string logDir = Path.Combine(rootDir, "logs");
                Directory.CreateDirectory(logDir);

                Dictionary<string, int> processState = new Dictionary<string, int>();
                processState["host_pid"] = Process.GetCurrentProcess().Id;

                AddProcessState(processState, "ollama_pid", ollamaProcess);
                AddProcessState(processState, "backend_pid", backendProcess);
                AddProcessState(processState, "frontend_pid", frontendProcess);

                StringBuilder json = new StringBuilder();
                json.Append("{");
                bool firstEntry = true;
                foreach (KeyValuePair<string, int> entry in processState)
                {
                    if (!firstEntry)
                    {
                        json.Append(",");
                    }

                    json.Append("\"");
                    json.Append(entry.Key);
                    json.Append("\":");
                    json.Append(entry.Value);
                    firstEntry = false;
                }
                json.Append("}");

                File.WriteAllText(processStatePath, json.ToString(), Encoding.ASCII);
            }
            catch
            {
                // Best effort only.
            }
        }

        private void AddProcessState(Dictionary<string, int> processState, string key, Process process)
        {
            if (process != null && !process.HasExited)
            {
                processState[key] = process.Id;
            }
        }

        private void AppendLog(string source, string message)
        {
            try
            {
                string logDir = Path.Combine(rootDir, "logs");
                Directory.CreateDirectory(logDir);
                File.AppendAllText(
                    Path.Combine(logDir, source + ".log"),
                    DateTime.Now.ToString("s") + " " + message + Environment.NewLine);
            }
            catch
            {
                // Logging failures should not break startup.
            }
        }

        private void SetStatus(string title, string detail)
        {
            statusLabel.Text = title;
            detailLabel.Text = detail;
        }

        private async Task WaitForEndpointAsync(string url, TimeSpan timeout)
        {
            DateTime deadline = DateTime.UtcNow.Add(timeout);
            Exception lastError = null;

            while (DateTime.UtcNow < deadline)
            {
                try
                {
                    HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
                    request.Method = "GET";
                    request.Timeout = 3000;
                    using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                    {
                        if ((int)response.StatusCode >= 200 && (int)response.StatusCode < 500)
                        {
                            return;
                        }
                    }
                }
                catch (Exception ex)
                {
                    lastError = ex;
                }

                await Task.Delay(1000);
            }

            throw new TimeoutException("Frontend did not start at " + url + ".", lastError);
        }

        private void ShellForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            WriteProcessState();

            for (int i = childProcesses.Count - 1; i >= 0; i--)
            {
                try
                {
                    Process process = childProcesses[i];
                    if (process != null && !process.HasExited)
                    {
                        process.Kill();
                        process.WaitForExit(3000);
                    }
                }
                catch
                {
                    // Best effort cleanup.
                }
            }
        }
    }
}
