# Project Artificium 🚀

A cutting-edge AI-powered 🦾 web application backend designed to revolutionize content creation. The platform will enable users to collaborate , generate, edit, and optimize various types of content using advanced artificial intelligence algorithms and agents.

# Documentation

Read About Artificium [here](https://www.notion.so/18969dc0d7c680599265fe24163c5f79?v=18969dc0d7c680af90eb000c3149e379&p=18969dc0d7c68011a987d05650b85f29&pm=s) on notion

and also view the artificium flow chart [here](https://miro.com/app/board/uXjVLn8stTo=/)

## REQUIREMENTS

- Docker (linux) or Docker Desktop (Mac and windows) [here](https://www.docker.com)
- POSTMAN [here](https://www.postman.com/downloads/)

### 1. Installation

```sh
    git clone https://github.com/CreatorXperience/Artificium.git
```

then:

```sh
    cd Artificium
    npm install
```

### 2. ENV VARIABLES

make sure the following `env` variables are provided before starting the server:

- SECRET (for signing cookie)
- DATABASE_URL (mongodb database url )
- DATABASE_URL_TEST (local mongdb database url ) e.g mongodb://localhost:27017

### 3. Start DEV server

```sh
    npm start
```

or:

```sh
    npx nx serve
```

NOTE: any change you make within packages folder will require you to stop the serve and start it up again for your latest code changes to reflect

### 4. Run Tests

The following steps assumes you have docker installed :

1. pull `mongodb/mongodb-atlas-local` image so test ENV can test against a local database instead of cloud database

   ```sh
       docker pull mongodb/mongodb-atlas-local
   ```

2. run `docker run -d  -p 27017:27017 mongodb/mongodb-atlas-local` to start the mongodb container

3. Stop DEV server before running test because running test will create a new prisma client compatible for test ENV which will cause the `npx serve` to quit and start building

- to run a test for a specific library, execute:

```sh
npm test packages/your-library
```

- to run test for the entire application, execute :

```sh
npm test
```

- to watch for test changes run:

```sh
npm test  --watch
```
