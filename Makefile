TESTS = test/

test:
	@NODE_ENV=test ./node_modules/.bin/nodeunit \
			$(TESTS)
worker:
	node tsm_worker.js
server:
	node server.js
.PHONY: test
