# Lumexus Native Swarm v0.1 verification

Required before merge:

- [ ] `npx tsc --noEmit --pretty false`
- [ ] `npx vitest run tests/lumexus-swarm`
- [ ] GitHub Actions Lumexus Native Swarm CI green
- [ ] Confirm out-of-scope request never invokes executor
- [ ] Confirm high/critical request enters approval queue without executor invocation
- [ ] Confirm kill switch blocks subsequent tool evaluation
- [ ] Confirm default registry exposes no exploit or production mutation capability

This branch does not claim production deployment until all checks above have fresh evidence.
