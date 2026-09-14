#!/bin/sh
# Claude Code hook for Robomotion app projects (SessionStart and Stop).
#
# The judgment lives in the CLI (`robomotion app handover-check`), which reads
# what `app validate`, `app smoke` and `app screen` recorded under
# .robomotion/ and holds a hand-over once per skipped step. Outside an app
# project, or with no robomotion CLI (or one too old to have the check), it
# lets everything through.
command -v robomotion >/dev/null 2>&1 || exit 0
robomotion app handover-check "$@" 2>/dev/null || true
