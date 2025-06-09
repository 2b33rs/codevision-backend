run:
	npm run build
	npm run start

db:
	npx prisma migrate reset --force
	npx prisma studio

deploy:
	npm install
	npm run prisma
	npm run postbuild
	npm run release --if-present

test:
	npx vitest run
