#!/usr/bin/env bats
#
# UX guard for the interactive wizard, driven by expect. The flag-driven tests
# cover artifact generation; this one exercises the actual prompt flow.
# Gated: run with TEST_INTERACTIVE=1.

load ../lib/helpers

setup() {
  [ -n "$TEST_INTERACTIVE" ] || skip "set TEST_INTERACTIVE=1 to run the interactive wizard test"
  command -v expect >/dev/null || skip "expect not installed"
}

teardown() { atmosphere_scratch_cleanup; }

@test "interactive wizard produces a valid local install" {
  atmosphere_scratch
  cd "$ATMOSPHERE_SCRATCH"
  "${BATS_TEST_DIRNAME}/../expects/install/interactive.sh"

  [ -f "$ATMOSPHERE_SCRATCH/atmosphere/docker-compose.yml" ]
  grep -q "'8080:8080'" "$ATMOSPHERE_SCRATCH/atmosphere/docker-compose.yml"
  grep -q 'image: postgres' "$ATMOSPHERE_SCRATCH/atmosphere/docker-compose.yml"
  grep -q 'image: redis' "$ATMOSPHERE_SCRATCH/atmosphere/docker-compose.yml"
}
