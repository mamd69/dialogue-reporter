# GOAP Methodology Guide for Software Projects

**Document Purpose:** Explain GOAP planning for software development
**Audience:** Developers, Architects, Project Managers
**Last Updated:** 2025-11-11

---

## What is GOAP?

**Goal-Oriented Action Planning (GOAP)** is an AI planning algorithm originally developed for game AI that creates optimal action sequences to achieve goals. It uses A* pathfinding to search through a state space and find the lowest-cost path from current state to goal state.

### Origin

GOAP was pioneered by Jeff Orkin at MIT for the game F.E.A.R. (2005), where AI agents dynamically planned complex behaviors by composing simple actions based on world state.

### Core Concept

Instead of hardcoding decision trees, GOAP:
1. Defines the current world state
2. Defines the desired goal state
3. Has a library of actions with preconditions and effects
4. Uses A* search to find optimal action sequence
5. Executes the plan and adapts if conditions change

---

## Why GOAP for Software Development?

### Traditional Planning Problems

```yaml
Static Plans:
  ❌ Can't adapt to changing conditions
  ❌ Require manual updates when issues arise
  ❌ Don't optimize for cost/time
  ❌ Hard to find optimal sequences
  ❌ Don't handle dependencies well

Manual Planning:
  ❌ Time-consuming and error-prone
  ❌ Miss optimization opportunities
  ❌ Inconsistent across planners
  ❌ Hard to verify completeness
```

### GOAP Advantages

```yaml
Dynamic Planning:
  ✓ Adapts automatically to changes
  ✓ Replans when actions fail
  ✓ Optimizes for cost/time
  ✓ Finds optimal sequences (A* guarantee)
  ✓ Handles dependencies naturally

Automated Planning:
  ✓ Fast and consistent
  ✓ Explores all possibilities
  ✓ Verifies completeness
  ✓ Transparent reasoning
  ✓ Reproducible results
```

---

## GOAP Core Components

### 1. World State

The world state is a set of boolean or valued properties describing the current situation.

**Example for Dialogue Reporter:**
```yaml
world_state:
  formatter_module_exists: false
  writer_module_exists: false
  mcp_protocol_complete: false
  tests_passing: false
  build_passing: false
  test_coverage: 0
  performance_overhead: 999
```

**Properties:**
- Can be boolean (true/false)
- Can be numeric (0-100)
- Can be string ("none", "partial", "complete")
- Must be observable/testable
- Changes through action effects

### 2. Goal State

The goal state defines what should be true when complete.

**Example:**
```yaml
goal_state:
  formatter_module_exists: true
  writer_module_exists: true
  mcp_protocol_complete: true
  tests_passing: true
  build_passing: true
  test_coverage: ">90"
  performance_overhead: "<5"
```

**Characteristics:**
- Subset of world state
- Defines success criteria
- May have constraints (>, <, >=, <=)
- Should be achievable
- Should be testable

### 3. Actions

Actions are operations that transform world state. Each action has:
- **Name:** Identifies the action
- **Cost:** Time, money, or effort required
- **Preconditions:** What must be true to execute
- **Effects:** What becomes true after execution

**Example Action:**
```yaml
action: IMPLEMENT_FORMATTER
cost: 60  # minutes
preconditions:
  - typescript_configured: true
  - capturer_module_exists: true
effects:
  - formatter_module_exists: true
  - markdown_generation_working: true
description: "Create formatter.ts module"
```

**Action Properties:**
- Atomic (single unit of work)
- Deterministic (same input → same output)
- Observable (effects can be verified)
- Reversible (can often be undone)

### 4. Planner (A* Search)

The planner finds the optimal sequence of actions.

**Algorithm:**
```
1. Start with current world state
2. Create open list with initial state
3. For each state in open list:
   a. For each available action:
      - Check if preconditions are met
      - Calculate new state after effects
      - Calculate cost (g) and heuristic (h)
      - Add to open list if better path
   b. Select lowest f = g + h
4. When goal state reached, return path
5. Extract action sequence from path
```

**Example:**
```
Current State: {formatter: false, writer: false}
Goal State: {formatter: true, writer: true}

Actions:
- IMPLEMENT_FORMATTER: cost=60, effects={formatter: true}
- IMPLEMENT_WRITER: cost=45, effects={writer: true}

A* Search:
State 0: {formatter: false, writer: false}, g=0, h=2
  → Action: IMPLEMENT_FORMATTER
State 1: {formatter: true, writer: false}, g=60, h=1
  → Action: IMPLEMENT_WRITER
State 2: {formatter: true, writer: true}, g=105, h=0 ✓ GOAL

Plan: [IMPLEMENT_FORMATTER, IMPLEMENT_WRITER]
Total Cost: 105 minutes
```

---

## GOAP Planning Process

### Step 1: Define Current State

**Analyze existing system:**
```yaml
# Check what exists
ls -la src/
npm test
git log

# Document state
current_state:
  - architecture_documented: true
  - capturer_exists: true
  - formatter_exists: false
  - writer_exists: false
  - tests_exist: false
```

### Step 2: Define Goal State

**Specify success criteria:**
```yaml
goal_state:
  - all_modules_implemented: true
  - tests_passing: true
  - test_coverage: ">90%"
  - performance_met: "<5ms"
  - build_passing: true
  - documentation_complete: true
```

### Step 3: Define Action Library

**List all possible actions:**
```yaml
actions:
  - IMPLEMENT_FORMATTER:
      cost: 60
      preconditions: [typescript_configured]
      effects: [formatter_exists: true]

  - IMPLEMENT_WRITER:
      cost: 45
      preconditions: [typescript_configured]
      effects: [writer_exists: true]

  - WRITE_UNIT_TESTS:
      cost: 90
      preconditions: [formatter_exists, writer_exists]
      effects: [tests_exist: true]

  - RUN_BUILD:
      cost: 15
      preconditions: [all_code_exists]
      effects: [build_passing: true]
```

### Step 4: Run A* Search

**Find optimal plan:**
```python
def find_plan(current_state, goal_state, actions):
    open_list = PriorityQueue()
    open_list.put((0, current_state, []))
    visited = set()

    while not open_list.empty():
        f_cost, state, path = open_list.get()

        if is_goal(state, goal_state):
            return path  # Found optimal plan!

        if state in visited:
            continue
        visited.add(state)

        for action in actions:
            if meets_preconditions(action, state):
                new_state = apply_effects(action, state)
                new_path = path + [action]
                g_cost = calculate_cost(new_path)
                h_cost = heuristic(new_state, goal_state)
                f_cost = g_cost + h_cost

                open_list.put((f_cost, new_state, new_path))

    return None  # No plan found
```

### Step 5: Execute with OODA Loop

**Adaptive execution:**
```
Loop forever:
  1. OBSERVE
     - Check current state
     - Monitor action progress
     - Detect changes/errors

  2. ORIENT
     - Compare actual vs expected state
     - Identify deviations
     - Calculate remaining cost

  3. DECIDE
     - Continue if on track
     - Replan if deviation detected
     - Adjust if minor issue

  4. ACT
     - Execute next action
     - Update world state
     - Verify effects
```

---

## GOAP + OODA Loop Integration

### OODA Loop Explained

**OODA** = Observe, Orient, Decide, Act (developed by John Boyd for military strategy)

**Applied to Software Development:**

```
┌──────────────────────────────────────────────┐
│                 OBSERVE                      │
│  • Check current implementation state        │
│  • Monitor test results                      │
│  • Review error logs                         │
│  • Verify preconditions                      │
└──────────────────┬───────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│                 ORIENT                       │
│  • Compare actual vs expected state          │
│  • Identify what changed                     │
│  • Assess impact on plan                     │
│  • Calculate replanning cost                 │
└──────────────────┬───────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│                 DECIDE                       │
│  • Continue with plan?                       │
│  • Need to replan?                           │
│  • Adjust action costs?                      │
│  • Skip unnecessary actions?                 │
└──────────────────┬───────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│                  ACT                         │
│  • Execute next action                       │
│  • Spawn agents/run commands                │
│  • Collect results                           │
│  • Update world state                        │
└──────────────────┬───────────────────────────┘
                   │
                   └────────┐
                            ↓
                      ┌───────────┐
                      │   LOOP    │
                      └───────────┘
```

### Integration Example

```python
# Initial GOAP Plan
plan = goap_planner.find_plan(current_state, goal_state)

# Execute with OODA Loop
while not goal_achieved():
    # OBSERVE
    actual_state = observe_system()
    action_result = get_last_action_result()

    # ORIENT
    state_deviation = compare(actual_state, expected_state)

    # DECIDE
    if state_deviation > THRESHOLD:
        # Major deviation: replan from current state
        plan = goap_planner.find_plan(actual_state, goal_state)
    elif action_result.failed:
        # Action failed: try alternative or replan
        if has_alternative(current_action):
            plan = insert_alternative(plan, current_action)
        else:
            plan = goap_planner.find_plan(actual_state, goal_state)
    elif action_result.effects_exceeded:
        # Action did more than expected: skip downstream actions
        plan = optimize_plan(plan, actual_state)
    else:
        # On track: continue with plan
        pass

    # ACT
    next_action = plan.next()
    execute(next_action)
    update_state(next_action.effects)
```

---

## Practical GOAP Example: Dialogue Reporter

### Initial State Analysis

```yaml
current_state:
  # Existing
  architecture_documented: true
  package_json_exists: true
  capturer_implemented: true
  mcp_server_skeleton: true
  typescript_configured: true

  # Missing
  formatter_exists: false
  writer_exists: false
  event_hooks_exists: false
  config_system_exists: false
  cli_tool_exists: false
  tests_exist: false
  build_passing: false
```

### Goal State Definition

```yaml
goal_state:
  # All modules implemented
  formatter_exists: true
  writer_exists: true
  event_hooks_exists: true
  config_system_exists: true
  cli_tool_exists: true

  # Quality gates passed
  tests_exist: true
  test_coverage: ">90%"
  build_passing: true
  performance_overhead: "<5ms"

  # Production ready
  documentation_complete: true
  npm_package_ready: true
```

### Action Library

```yaml
actions:
  - name: IMPLEMENT_FORMATTER
    cost: 60
    preconditions:
      - typescript_configured: true
      - capturer_implemented: true
    effects:
      - formatter_exists: true
      - markdown_generation_working: true

  - name: IMPLEMENT_WRITER
    cost: 45
    preconditions:
      - typescript_configured: true
    effects:
      - writer_exists: true
      - file_output_working: true

  - name: COMPLETE_MCP_SERVER
    cost: 60
    preconditions:
      - formatter_exists: true
      - writer_exists: true
      - event_hooks_exists: true
    effects:
      - mcp_protocol_complete: true
      - server_lifecycle_working: true

  - name: IMPLEMENT_UNIT_TESTS
    cost: 90
    preconditions:
      - formatter_exists: true
      - writer_exists: true
      - config_system_exists: true
    effects:
      - unit_tests_exist: true
      - test_coverage: 70

  - name: RUN_BUILD_VERIFY
    cost: 15
    preconditions:
      - unit_tests_exist: true
      - integration_tests_exist: true
      - performance_tests_exist: true
    effects:
      - build_passing: true
      - npm_package_ready: true
```

### A* Search Execution

```
Initial State:
  formatter=false, writer=false, mcp_complete=false, tests=false

Goal State:
  formatter=true, writer=true, mcp_complete=true, tests=true

Search Tree:
State 0 [g=0, h=4]: {all false}
  ├─→ IMPLEMENT_FORMATTER
  │   State 1 [g=60, h=3]: {formatter=true}
  │     ├─→ IMPLEMENT_WRITER
  │     │   State 2 [g=105, h=2]: {formatter=true, writer=true}
  │     │     ├─→ COMPLETE_MCP (needs event_hooks!)
  │     │     │   ❌ Precondition not met
  │     │     └─→ IMPLEMENT_EVENT_HOOKS
  │     │         State 3 [g=135, h=2]: {+event_hooks}
  │     │           └─→ COMPLETE_MCP
  │     │               State 4 [g=195, h=1]: {+mcp_complete}
  │     │                 └─→ IMPLEMENT_TESTS
  │     │                     State 5 [g=285, h=0]: ✓ GOAL
  │     └─→ IMPLEMENT_EVENT_HOOKS
  │         ...alternative path, higher cost...
  └─→ IMPLEMENT_WRITER
      ...parallel path exploration...

Optimal Plan Found:
[
  IMPLEMENT_FORMATTER (60m),
  IMPLEMENT_WRITER (45m),
  IMPLEMENT_EVENT_HOOKS (30m),
  COMPLETE_MCP (60m),
  IMPLEMENT_TESTS (90m)
]

Total Cost: 285 minutes
Path Length: 5 actions
```

### Execution with OODA

```
Action 1: IMPLEMENT_FORMATTER
  OBSERVE: formatter.ts created, compiles successfully
  ORIENT: State updated as expected
  DECIDE: Continue with plan
  ACT: Execute next action

Action 2: IMPLEMENT_WRITER
  OBSERVE: writer.ts created, tests failing
  ORIENT: Unexpected test failures
  DECIDE: Fix tests, don't replan (minor issue)
  ACT: Fix and continue

Action 3: IMPLEMENT_EVENT_HOOKS
  OBSERVE: event-hooks.ts created, but MCP integration unclear
  ORIENT: May need additional integration work
  DECIDE: Add new action to plan
  ACT: Insert CLARIFY_MCP_INTEGRATION before COMPLETE_MCP

Action 4: CLARIFY_MCP_INTEGRATION (replanned)
  OBSERVE: Integration approach clarified
  ORIENT: Back on track
  DECIDE: Continue with adjusted plan
  ACT: Execute COMPLETE_MCP

... continue until goal state achieved
```

---

## GOAP Best Practices

### Action Design

**✓ DO:**
- Keep actions atomic (single responsibility)
- Make effects deterministic
- Define clear preconditions
- Include accurate cost estimates
- Make effects verifiable

**✗ DON'T:**
- Create overly complex actions
- Have hidden preconditions
- Make effects ambiguous
- Underestimate costs
- Combine unrelated operations

### State Design

**✓ DO:**
- Use observable properties
- Keep state minimal but complete
- Use clear naming
- Include quality metrics
- Make state testable

**✗ DON'T:**
- Include unobservable state
- Use ambiguous properties
- Over-complicate state space
- Ignore important metrics
- Mix concerns

### Planning Strategy

**✓ DO:**
- Use informed heuristics
- Consider action costs
- Account for dependencies
- Plan for failures
- Enable replanning

**✗ DON'T:**
- Use naive heuristics
- Ignore costs
- Forget dependencies
- Assume perfection
- Lock into rigid plans

---

## GOAP vs. Other Planning Methods

### GOAP vs. Decision Trees

```yaml
Decision Trees:
  Structure: Hardcoded if-then rules
  Flexibility: Low (must update tree)
  Optimization: Manual
  Adaptability: Requires reprogramming

GOAP:
  Structure: Dynamic action composition
  Flexibility: High (auto-adapts)
  Optimization: Automatic (A*)
  Adaptability: Built-in replanning
```

### GOAP vs. Behavior Trees

```yaml
Behavior Trees:
  Structure: Hierarchical task decomposition
  Execution: Top-down traversal
  Flexibility: Medium (can switch branches)
  Optimization: Limited

GOAP:
  Structure: Flat action library
  Execution: Goal-driven search
  Flexibility: High (any valid sequence)
  Optimization: Optimal by design
```

### GOAP vs. Manual Planning

```yaml
Manual Planning:
  Speed: Slow (human time)
  Optimality: Varies by planner
  Consistency: Inconsistent
  Adaptability: Requires human intervention

GOAP:
  Speed: Fast (algorithmic)
  Optimality: Guaranteed (A*)
  Consistency: Always consistent
  Adaptability: Automatic replanning
```

---

## When to Use GOAP

### Ideal Use Cases

**✓ Complex Projects:**
- Many interdependent tasks
- Multiple valid paths to goal
- Need cost optimization
- Requires adaptability

**✓ Dynamic Environments:**
- Changing requirements
- Uncertain conditions
- Risk of failures
- Need for replanning

**✓ Optimization Critical:**
- Time-sensitive projects
- Resource-constrained
- Cost-sensitive
- Need best solution

### When NOT to Use GOAP

**✗ Simple Linear Projects:**
- Single obvious path
- No dependencies
- No need for optimization
- Static requirements

**✗ Highly Uncertain Goals:**
- Goal not well-defined
- Success criteria unclear
- State not observable
- Effects unpredictable

**✗ Real-time Constraints:**
- Need instant decisions
- Can't afford planning time
- Simple reactive behavior sufficient
- No time for search

---

## Implementing GOAP in Practice

### Basic Implementation

```typescript
// State representation
interface WorldState {
  [key: string]: boolean | number | string;
}

// Action definition
interface Action {
  name: string;
  cost: number;
  preconditions: WorldState;
  effects: WorldState;
  execute: () => Promise<void>;
}

// Simple GOAP Planner
class GOAPPlanner {
  findPlan(
    current: WorldState,
    goal: WorldState,
    actions: Action[]
  ): Action[] | null {
    // A* search implementation
    const openList = new PriorityQueue<PlanNode>();
    const closedList = new Set<string>();

    openList.push({
      state: current,
      path: [],
      cost: 0,
      heuristic: this.calculateHeuristic(current, goal)
    });

    while (!openList.isEmpty()) {
      const node = openList.pop();

      if (this.isGoalMet(node.state, goal)) {
        return node.path; // Found plan!
      }

      const stateKey = this.serializeState(node.state);
      if (closedList.has(stateKey)) continue;
      closedList.add(stateKey);

      for (const action of actions) {
        if (this.meetsPrecon ditions(action, node.state)) {
          const newState = this.applyEffects(action, node.state);
          const newPath = [...node.path, action];
          const newCost = node.cost + action.cost;
          const heuristic = this.calculateHeuristic(newState, goal);

          openList.push({
            state: newState,
            path: newPath,
            cost: newCost,
            heuristic: heuristic
          });
        }
      }
    }

    return null; // No plan found
  }

  private calculateHeuristic(current: WorldState, goal: WorldState): number {
    // Manhattan distance: count differing properties
    let distance = 0;
    for (const key in goal) {
      if (current[key] !== goal[key]) {
        distance++;
      }
    }
    return distance;
  }

  private isGoalMet(state: WorldState, goal: WorldState): boolean {
    for (const key in goal) {
      if (state[key] !== goal[key]) {
        return false;
      }
    }
    return true;
  }

  private meetsPreconditions(action: Action, state: WorldState): boolean {
    for (const key in action.preconditions) {
      if (state[key] !== action.preconditions[key]) {
        return false;
      }
    }
    return true;
  }

  private applyEffects(action: Action, state: WorldState): WorldState {
    return { ...state, ...action.effects };
  }
}
```

### Usage Example

```typescript
// Define state
const currentState: WorldState = {
  formatter_exists: false,
  writer_exists: false,
  tests_exist: false,
  build_passing: false
};

const goalState: WorldState = {
  formatter_exists: true,
  writer_exists: true,
  tests_exist: true,
  build_passing: true
};

// Define actions
const actions: Action[] = [
  {
    name: "IMPLEMENT_FORMATTER",
    cost: 60,
    preconditions: {},
    effects: { formatter_exists: true },
    execute: async () => {
      console.log("Implementing formatter...");
      // Actual implementation
    }
  },
  {
    name: "IMPLEMENT_WRITER",
    cost: 45,
    preconditions: {},
    effects: { writer_exists: true },
    execute: async () => {
      console.log("Implementing writer...");
    }
  },
  {
    name: "WRITE_TESTS",
    cost: 90,
    preconditions: {
      formatter_exists: true,
      writer_exists: true
    },
    effects: { tests_exist: true },
    execute: async () => {
      console.log("Writing tests...");
    }
  },
  {
    name: "BUILD",
    cost: 15,
    preconditions: { tests_exist: true },
    effects: { build_passing: true },
    execute: async () => {
      console.log("Building...");
    }
  }
];

// Plan and execute
const planner = new GOAPPlanner();
const plan = planner.findPlan(currentState, goalState, actions);

if (plan) {
  console.log("Plan found!");
  console.log(plan.map(a => a.name).join(" → "));

  // Execute with OODA loop
  let state = currentState;
  for (const action of plan) {
    await action.execute();
    state = { ...state, ...action.effects };
    console.log("Current state:", state);
  }
} else {
  console.log("No plan found!");
}
```

---

## Advanced GOAP Techniques

### 1. Weighted Heuristics

```typescript
calculateHeuristic(current: WorldState, goal: WorldState): number {
  let h = 0;

  for (const key in goal) {
    if (current[key] !== goal[key]) {
      // Weight by importance
      const weight = this.getImportanceWeight(key);
      h += weight;
    }
  }

  return h;
}

getImportanceWeight(property: string): number {
  const weights = {
    'critical_feature': 10,
    'important_feature': 5,
    'nice_to_have': 1
  };
  return weights[property] || 1;
}
```

### 2. Dynamic Cost Adjustment

```typescript
class AdaptiveGOAPPlanner extends GOAPPlanner {
  private costHistory: Map<string, number[]> = new Map();

  adjustActionCost(action: Action, actualCost: number): void {
    const history = this.costHistory.get(action.name) || [];
    history.push(actualCost);
    this.costHistory.set(action.name, history);

    // Update action cost with moving average
    action.cost = this.calculateAverage(history);
  }

  calculateAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}
```

### 3. Parallel Action Support

```typescript
interface ParallelAction extends Action {
  parallelizable: boolean;
  conflictsWith?: string[];
}

findParallelPlan(
  current: WorldState,
  goal: WorldState,
  actions: ParallelAction[]
): ParallelAction[][] {
  // Find sequential plan first
  const sequentialPlan = this.findPlan(current, goal, actions);

  // Group parallelizable actions
  const parallelPlan: ParallelAction[][] = [];
  let currentBatch: ParallelAction[] = [];

  for (const action of sequentialPlan) {
    if (this.canAddToBatch(action, currentBatch)) {
      currentBatch.push(action);
    } else {
      parallelPlan.push(currentBatch);
      currentBatch = [action];
    }
  }

  if (currentBatch.length > 0) {
    parallelPlan.push(currentBatch);
  }

  return parallelPlan;
}
```

---

## Conclusion

GOAP provides:
- **Optimal Planning:** A* guarantees minimum cost
- **Dynamic Adaptation:** OODA loop handles changes
- **Clear Reasoning:** Explicit states and actions
- **Systematic Approach:** Reproducible results
- **Scalability:** Works for complex projects

**When to Use:** Complex projects with dependencies, need for optimization, and changing conditions.

**Key Takeaway:** GOAP + OODA creates an intelligent, adaptive planning system that finds optimal solutions and automatically adjusts to reality.

---

**References:**
- Orkin, J. (2006). "Three States and a Plan: The A.I. of F.E.A.R."
- Boyd, J. (1976). "The Essence of Winning and Losing" (OODA Loop)
- Hart, P., Nilsson, N., Raphael, B. (1968). "A Formal Basis for the Heuristic Determination of Minimum Cost Paths" (A*)

**Document Version:** 1.0
**Last Updated:** 2025-11-11
