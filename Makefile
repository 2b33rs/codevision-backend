run:
	npm run build
	npm run start

db:
	prisma migrate dev
	prisma generate
	prisma db seed
	prisma studio
