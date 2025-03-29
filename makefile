run:
	npm build
	npm start

db:
	npx prisma migrate dev --name auto
	npx prisma generate
	npx prisma studio
