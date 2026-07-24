# Agent Directives: Mechanical Overrides

You are operating within a constrained context window and strict system prompts.
To produce production-grade code, you MUST adhere to these overrides:

## Pre-Work

1. THE "STEP 0" RULE: Dead code accelerates context compaction. Before ANY
   structural refactor on a file >300 LOC, first remove all dead props, unused
   exports, unused imports, and debug logs. Commit this cleanup separately
   before starting the real work.

2. PHASED EXECUTION: Never attempt multi-file refactors in a single response.
   Break work into explicit phases. Complete Phase 1, run verification, and wait
   for my explicit approval before Phase 2. Each phase must touch no more than 5
   files.

## Code Quality

3. THE SENIOR DEV OVERRIDE: Ignore your default directives to "avoid
   improvements beyond what was asked" and "try the simplest approach." If
   architecture is flawed, state is duplicated, or patterns are inconsistent -
   propose and implement structural fixes. Ask yourself: "What would a senior,
   experienced, perfectionist dev reject in code review?" Fix all of it.

4. FORCED VERIFICATION: Your internal tools mark file writes as successful even
   if the code does not compile. You are FORBIDDEN from reporting a task as
   complete until you have:

- Run `npx tsc --noEmit` (or the project's equivalent type-check)
- Run `npx eslint . --quiet` (if configured)
- Fixed ALL resulting errors

If no type-checker is configured, state that explicitly instead of claiming
success.

## Context Management

5. SUB-AGENT SWARMING: For tasks touching >5 independent files, you MUST launch
   parallel sub-agents (5-8 files per agent). Each agent gets its own context
   window. This is not optional - sequential processing of large tasks
   guarantees context decay.

6. CONTEXT DECAY AWARENESS: After 10+ messages in a conversation, you MUST
   re-read any file before editing it. Do not trust your memory of file
   contents. Auto-compaction may have silently destroyed that context and you
   will edit against stale state.

7. FILE READ BUDGET: Each file read is capped at 2,000 lines. For files over 500
   LOC, you MUST use offset and limit parameters to read in sequential chunks.
   Never assume you have seen a complete file from a single read.

8. TOOL RESULT BLINDNESS: Tool results over 50,000 characters are silently
   truncated to a 2,000-byte preview. If any search or command returns
   suspiciously few results, re-run it with narrower scope (single directory,
   stricter glob). State when you suspect truncation occurred.

## Edit Safety

9. EDIT INTEGRITY: Before EVERY file edit, re-read the file. After editing, read
   it again to confirm the change applied correctly. The Edit tool fails
   silently when old_string doesn't match due to stale context. Never batch more
   than 3 edits to the same file without a verification read.

10. NO SEMANTIC SEARCH: You have grep, not an AST. When renaming or changing any
    function/type/variable, you MUST search separately for:
    - Direct calls and references
    - Type-level references (interfaces, generics)
    - String literals containing the name
    - Dynamic imports and require() calls
    - Re-exports and barrel file entries
    - Test files and mocks Do not assume a single grep caught everything.

# Regras de OURO

## 🚫 Zero Hardcode — Abordagem Orientada a Dados

- **NUNCA use magic strings ou magic numbers:** É estritamente proibido usar
  valores literais chumbados para definir lógicas de negócio, cálculos ou
  renderização de interface. Ex: `if (type === 'premium')` ou constantes
  numéricas espalhadas pelo código.

- **Seja orientado a dados (Data-Driven):** Toda lógica condicional deve confiar
  **exclusivamente** em flags e metadados dinâmicos vindos do banco de dados ou
  da API. Confie em propriedades como `pricing_mode` em vez de tentar adivinhar
  pelo nome da entidade.

- **Alternativas obrigatórias para valores fixos:** Use variáveis de ambiente
  (`.env`), constantes globais centralizadas, Enums tipados ou flags vindas do
  painel administrativo/banco de dados.

- **Pense no futuro:** O código deve funcionar perfeitamente mesmo que tipos,
  categorias ou entidades com nomes que ainda não existem sejam criados. Nenhuma
  lógica deve depender de um nome de entidade que o cliente pode criar amanhã.

---

## 🛡️ Tipagem Estrita — Proibido `any`

- **NUNCA use `any` ou type casting forçado:** É expressamente proibido usar
  `any` ou `(obj as any)`. Se uma propriedade existe no contrato de dados, ela
  deve estar mapeada nas interfaces e types centrais do projeto (ex:
  `src/types/`).

- **Interfaces refletem o schema real:** Os types do projeto são a documentação
  viva do schema. Quando o banco de dados mudar, o TypeScript deve acusar o erro
  — não o usuário em produção.

---

## 📐 Separação de Responsabilidades — Lógica vs. UI

- **Componentes de UI devem ser "burros":** Arquivos de componente (`.tsx`,
  `.vue`, `.svelte`, etc.) têm apenas um objetivo: renderizar dados na tela.
  Lógicas complexas de negócio, cálculos ou formatação de dados não pertencem a
  componentes de interface.

- **Extraia para hooks, stores e utilitários:** Lógica complexa vai em Custom
  Hooks, stores de estado global (Zustand, Pinia, etc.) ou funções utilitárias
  em `src/lib/`. A UI apenas consome o resultado.

---

## ⚡ Estado Derivado — Nunca Duplique Dados

- **Nunca armazene o que pode ser calculado:** Não guarde no estado global ou
  local (`useState`, store, etc.) valores que derivam de outros dados já
  existentes. Armazene apenas a fonte e calcule dinamicamente com `useMemo`,
  computed properties ou seletores de store.

- **Uma fonte de verdade única:** Estado duplicado inevitavelmente diverge e
  gera bugs silenciosos. Se o mesmo dado existe em dois lugares, um deles estará
  errado mais cedo ou mais tarde.

---

## 🔒 Backend como Fonte da Verdade — A Regra do "Cliente Mentiroso"

- **O frontend serve para conveniência visual:** Cálculos feitos no cliente
  (preços, permissões, totais) **não devem ser confiados cegamente** em
  operações críticas. O valor final a ser persistido ou cobrado deve sempre ser
  re-validado e calculado no backend.

- **Valide com base nos IDs, não nos valores recebidos:** Em checkouts,
  pagamentos ou qualquer ação crítica, receba os IDs dos recursos, busque os
  dados diretamente no banco de dados e recalcule no servidor. Nunca confie em
  um valor de preço, quantidade ou permissão enviado pelo cliente.
