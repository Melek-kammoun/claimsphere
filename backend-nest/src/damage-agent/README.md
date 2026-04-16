Phase 1 starter for a future damage agent.

This folder is intentionally separate from `src/damage-analysis`.
It does not change the current backend flow.

Planned usage later:
1. `damage-analysis` keeps producing the raw analysis output.
2. `DamageAgentService` consumes that output.
3. `DamageAgentStateBuilder` converts it into an agent-ready envelope.
4. `DamageAgentLLMService` enriches the decision using OpenAI and the CSV dataset.

Data location:
- `src/damage-agent/data/car_damage_dataset.csv`

Current entry points:
- `DamageAgentService.prepareAgentEnvelope(analysis)`
- `DamageAgentService.decideDamage(analysis, vehicle)`
- `DamageAgentService.assessContractDamage(...)` via `damage-agent/assess`

How it works:
- `DamageAgentService` builds the state envelope for rule-based or future agent uses.
- `DamageAgentService.assessContractDamage(...)` récupère les détails du contrat par `contract_id` (numérique ou identifiant texte), appelle `damage-analysis`, puis passe ces données au LLM.
- `DamageAgentLLMService` charge `car_damage_dataset.csv` et assemble un prompt qui combine les informations du contrat, les dommages détectés et le dataset.
- LLM retourne une décision JSON avec :
  - `decision` (`repair` / `no_repair` / `manual_review`)
  - `estimatedTotalCostTnd`
  - `confidence`
  - `reason`
  - `damages`

Expected input shape:
- `results`
- `summary`
- optional annotated image fields

Current output shape:
- `agent_state`
- `summary`
- `results`
- `assets`
- `decision` via `DamageAgentService.decideDamage(...)`
