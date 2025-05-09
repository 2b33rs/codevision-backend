run:
	npm run build
	npm run start

db:
	npx prisma migrate dev
	npx prisma generate
	npx prisma db seed
	npx prisma studio
