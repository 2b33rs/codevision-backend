run:
	npm run build
	npm run start

db:
	npx prisma migrate reset --force
	npx prisma studio