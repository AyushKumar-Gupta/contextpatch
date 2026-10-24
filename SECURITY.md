# Security notes

ContextPatch is an early local-development MVP. It accepts a filesystem path and reads supported source files under that directory. Run it only on a trusted local machine and do not expose port 5000 to a public or untrusted network.

Before deploying beyond localhost, add authentication, restrict allowed scan roots, disable or constrain CORS, add request-rate limits, and review all filesystem and model boundaries. Do not scan repositories you do not own or have permission to inspect.

The scanner is read-only: it does not write into the selected repository. Optional Ollama integration sends a compact summary of findings to the configured local Ollama endpoint; it does not send full source files.
