# TODO

## SRP extraction (SimulationView -> useSimulation)
- [ ] Create/complete `src/hooks/useSimulation.ts`:
  - [ ] Ensure seed reroll wiring is functional
  - [ ] Move/finish confirmSaveResult into hook and expose as action
  - [ ] Ensure history load/save/delete behavior matches current SimulationView (including localStorage for now, since T4a comes later)
  - [ ] Ensure animation state machine matches current SimulationView (pause/resume/step forward/back/reset/skip)
- [ ] Refactor `src/components/SimulationView.tsx`:
  - [ ] Replace state/effects/handlers with hook calls
  - [ ] Keep UI/JSX behavior identical
  - [ ] Keep modal JSX (save + history) behavior identical

## Follow-on tasks (to be done after SRP extraction is complete)
- [ ] T4a eliminate localStorage fallback
- [ ] T4b simplify HistoryModal
- [ ] T2a unify getAdaptabilityScore into `src/utils/metricsHelpers.ts`
- [ ] T2b document GraphSize duplication
- [ ] T3a backend historyStore rowToEntry by named columns

## Validation
- [ ] `npm run build` passes
- [ ] Manual: run simulation in at least one scenario; verify playback controls
- [ ] Manual: history save/load and delete works

