# Contributing

This document will guide you through the process of contributing to mysql-plus.  
If you're new to open source in general, check out [GitHub's open source intro guide](https://guides.github.com/overviews/os-contributing/).


## Issue Contributions

Before creating an issue, please make sure that the problem is with this module and not the [mysql](https://github.com/mysqljs/mysql) module.

If reporting a bug, make sure to include a code snippet and/or other relevant information that can be used to reproduce the bug.


## Code Contributions

Before writing code and submitting a pull request, it's a good idea to first open an issue to propose the changes you'd like to make. That way, you can find out if your changes are likely to be accepted before you make them. It's not fun trying to contribute to a project only to have your code rejected :disappointed: ([as I know firsthand](https://github.com/sindresorhus/grunt-eslint/pull/105)).

Once you're sure you want to write code, follow these steps:

### Fork

Fork the project [on GitHub](https://github.com/nwoltman/node-mysql-plus.git), then check out your copy:

```sh
git clone https://github.com/<username>/node-mysql-plus.git
cd mysql-plus
git remote add upstream https://github.com/nwoltman/node-mysql-plus.git
```

### Setup

Install dependencies and the `grunt` command:

```sh
npm install
npm install -g grunt-cli # *nix users may need to use `sudo` with this command
```

### Branch

Create a feature branch to work on:

```sh
git checkout -b my-branch-name -t origin/master
```

### Code

When appropriate, please:

* Update related doc comments ([JSDoc 3](http://usejsdoc.org/)-style)
* Add/update related tests

You can check that your code's style passes linting by running:

```sh
grunt lint
```

### Test

#### Setup

First set the following environment variables so that the tests can connect to your MySQL database:

+ `MYSQL_HOST` (defaults to `localhost`)
+ `MYSQL_PORT` (defaults to `3306`)
+ `MYSQL_USER` (defaults to `root`)
+ `MYSQL_PASSWORD` (defaults to an empty string)

For example, if you're running MySQL on port 3307, you'd have to export the `MYSQL_PORT` environment variable:

```sh
# *nix
export MYSQL_PORT=3307

# Windows
setx MYSQL_PORT 3307 # Then close and reopen your command prompt
```

If you have an installation of MySQL running on `localhost:3306` with no password set for the root user, you don't need to do anything.

#### Running Tests

```sh
# Runs linting and all tests (make sure this passes before submitting your PR)
grunt

# Runs all tests
grunt test

# Runs only unit tests
grunt test:unit

#Runs only integration tests
grunt test:integration
```

### Commit

First, make sure git knows your name and email address:

```sh
git config --global user.name "Your Name"
git config --global user.email "your.name@example.com"
```

Writing good commit logs is important. A commit log should describe what changed and why.
Follow these guidelines when writing one:

1. The first line should be less that 70 characters and contain a short description of the change.
2. Keep the second line blank.
3. The rest is a more detailed description of the commit (only if necessary).

A good commit log looks like this:

```
Briefly explaining the commit in one line

Body of commit message is a few lines of text, explaining things
in more detail, possibly giving some background about the issue
being fixed, etc.
```

### Rebase

Use `git rebase` to sync your work if something has changed upstream.

```sh
$ git fetch upstream
$ git rebase upstream/master
```

### Push

```sh
$ git push origin my-branch-name
```

Then go to [GitHub](https://github.com/nwoltman/node-mysql-plus) and create a pull request.
