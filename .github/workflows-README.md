# Optional GitHub Actions

A workflow is not enabled in this initial package because the project has no dependency manager or automated browser-test harness yet. A first workflow should run `python3 scripts/validate_data.py` on pushes and pull requests, then build release ZIPs on tagged versions.
