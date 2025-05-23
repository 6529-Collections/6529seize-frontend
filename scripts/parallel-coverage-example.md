# Parallel Coverage Improvement Examples

## Running Coverage Improvement in Parallel

The coverage improvement script supports parallel execution across multiple independent processes or even different machines. Each process works on different files without any communication needed.

## How It Works

1. **File Assignment**: Each file gets a deterministic hash: `MD5(filepath) % TOTAL_PROCESSES`
2. **Process Selection**: Process N handles files where hash result equals N
3. **No Coordination**: Processes never need to communicate
4. **Dynamic Adaptation**: Works correctly even as files are added/removed

## Example Scenarios

### Local Parallel Execution (8 processes)

```bash
# Using the convenience script
./scripts/improve-coverage-parallel.sh 8

# Or manually in separate terminals
PROCESS_ID=0 TOTAL_PROCESSES=8 npm run improve-coverage
PROCESS_ID=1 TOTAL_PROCESSES=8 npm run improve-coverage
# ... up to PROCESS_ID=7
```

### Distributed Across Multiple Machines

**Machine A:**
```bash
# Handles files where hash % 4 = 0
PROCESS_ID=0 TOTAL_PROCESSES=4 npm run improve-coverage
```

**Machine B:**
```bash
# Handles files where hash % 4 = 1
PROCESS_ID=1 TOTAL_PROCESSES=4 npm run improve-coverage
```

**Machine C:**
```bash
# Handles files where hash % 4 = 2
PROCESS_ID=2 TOTAL_PROCESSES=4 npm run improve-coverage
```

**Machine D:**
```bash
# Handles files where hash % 4 = 3
PROCESS_ID=3 TOTAL_PROCESSES=4 npm run improve-coverage
```

### CI/CD Pipeline (GitHub Actions example)

```yaml
jobs:
  coverage:
    strategy:
      matrix:
        process_id: [0, 1, 2, 3, 4, 5, 6, 7]
    runs-on: ubuntu-latest
    env:
      PROCESS_ID: ${{ matrix.process_id }}
      TOTAL_PROCESSES: 8
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run improve-coverage
```

### Docker Swarm / Kubernetes

```yaml
# docker-compose.yml
services:
  coverage-worker:
    image: your-app:latest
    deploy:
      replicas: 8
    environment:
      - PROCESS_ID={{.Task.Slot}}
      - TOTAL_PROCESSES=8
    command: npm run improve-coverage
```

## File Distribution Example

Given files with coverage < 80%:
- `src/utils/auth.js` (30%)
- `src/utils/validation.js` (45%)
- `src/api/users.js` (55%)
- `src/api/posts.js` (60%)
- `src/components/Header.js` (65%)
- `src/components/Footer.js` (70%)
- `src/lib/cache.js` (75%)
- `src/lib/logger.js` (78%)

With 4 processes:
- **Process 0**: Gets files where `hash(filename) % 4 = 0`
- **Process 1**: Gets files where `hash(filename) % 4 = 1`
- **Process 2**: Gets files where `hash(filename) % 4 = 2`
- **Process 3**: Gets files where `hash(filename) % 4 = 3`

Each file is assigned to exactly one process, ensuring no overlap.

## Benefits

1. **No Coordination Overhead**: Processes work independently
2. **Fault Tolerant**: If one process fails, others continue
3. **Scalable**: Add more processes anytime
4. **Deterministic**: Same file always goes to same process ID
5. **Fair Distribution**: Hash function ensures even spread

## Important Notes

- Each process maintains its own `.coverage-progress.json` file
- All processes should use the same `TOTAL_PROCESSES` value
- Process IDs must be unique and range from 0 to TOTAL_PROCESSES-1
- The 20-minute time limit applies to each process independently 
