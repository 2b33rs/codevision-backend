run:
	npm run build
	npm run start

db:
	prisma migrate reset --force
	prisma studio