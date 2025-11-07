# Basic Usage Examples

## Example 1: Simple Question & Answer

**User:**
> What is the capital of France?

**Assistant:**
> The capital of France is Paris. It's the largest city in France and has been the capital since 987 AD when Hugh Capet chose it as his royal seat.

**Output:** `./dialogue-reports/conversation-2025-11-07-14-30-45.md`

---

## Example 2: Code Generation

**User:**
> Can you create a function to calculate fibonacci numbers?

**Assistant:**
> Here's an efficient implementation using memoization:

```typescript
function fibonacci(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 1) return n;

  if (memo.has(n)) {
    return memo.get(n)!;
  }

  const result = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  memo.set(n, result);

  return result;
}

// Example usage
console.log(fibonacci(10)); // 55
console.log(fibonacci(20)); // 6765
```

This implementation has O(n) time complexity instead of the naive O(2^n) approach.

**Output:** Markdown file with properly formatted code blocks and syntax highlighting

---

## Example 3: Multi-File Project

**User:**
> Create a simple Express API with TypeScript

**Assistant:**
> I'll create a basic Express API structure for you.

**Tool: Write**
File: `src/server.ts`

```typescript
import express from 'express';
import { userRoutes } from './routes/users';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

**Tool: Write**
File: `src/routes/users.ts`

```typescript
import { Router } from 'express';

export const userRoutes = Router();

userRoutes.get('/', (req, res) => {
  res.json({ users: [] });
});
```

**Output:** Markdown file capturing the entire conversation including all file creations and tool calls

---

## Example 4: Debugging Session

**User:**
> My React component isn't re-rendering when state changes

**Assistant:**
> Let me help you debug this. Can you show me your component code?

**User:**
> ```jsx
> function Counter() {
>   let count = 0;
>
>   return (
>     <button onClick={() => count++}>
>       Count: {count}
>     </button>
>   );
> }
> ```

**Assistant:**
> The issue is that you're using a regular variable instead of React state. Here's the fix:

```jsx
function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

The problem was that changing a regular variable doesn't trigger a re-render. You need to use `useState` to tell React to re-render when the value changes.

**Output:** Complete debugging conversation preserved with code examples

---

## File Naming

Conversations are automatically saved with timestamps:

- `conversation-2025-11-07-14-30-45.md` - Simple timestamp
- `conversation-2025-11-07-afternoon.md` - Custom pattern (configure in `.dialogue-reporter.json`)

---

## Configuration

Customize output in `.dialogue-reporter.json`:

```json
{
  "outputDirectory": "./dialogue-reports",
  "filenamePattern": "conversation-{timestamp}.md",
  "formatting": {
    "syntaxHighlighting": true,
    "includeMetadata": true,
    "includeTimestamps": true,
    "includeToolCalls": true
  }
}
```

---

## Tips

1. **Organize by topic**: Move important conversations to topic-specific folders
2. **Search easily**: Use `grep` to search across all conversations
3. **Share knowledge**: Commit conversation logs to your repo for team reference
4. **Archive old conversations**: Move old logs to an archive folder

---

For more examples, see the [documentation](../docs/examples.md).
