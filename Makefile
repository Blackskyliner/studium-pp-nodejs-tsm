TESTS = test/*.js

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
			--require should \
			--reporter list \
			--slow 20 \
			--growl \
			$(TESTS)
worker:
	node tsm_worker.js
server:
	node server.js
.PHONY: test
