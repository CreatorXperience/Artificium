function test(){
npm run generate-test-prisma && nx test $1  && npm run generate-dev-prisma
}

test $1