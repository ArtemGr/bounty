# SyncServer

[![Code Climate](https://codeclimate.com/github/nponiros/sync_server/badges/gpa.svg)](https://codeclimate.com/github/nponiros/sync_server)

## Synopsis

A small node server which uses [NeDB](https://github.com/louischatriot/nedb) to write data to the disk. The server can be used with a client for example [SyncClient](https://github.com/nponiros/sync_client) to save change sets which can later be synchronized with other devices. The server was made to work with the [ISyncProtocol](https://github.com/dfahlander/Dexie.js/wiki/Dexie.Syncable.ISyncProtocol) and [Dexie.Syncable](https://www.npmjs.com/package/dexie-syncable). It supports the poll pattern using AJAX and the react pattern using [nodejs-websocket](https://www.npmjs.com/package/nodejs-websocket).

## Installation and usage

Install globally using npm:

```bash
npm install -g sync-server
```

Before using the server it has to be initialized with:

```bash
sync-server init
```

The `init` action must be executed in an empty directory which will later be used to store the data. This folder represents a Database. During initialization a `config.json` file is create with the default server configuration.

You can start the server with:

```bash
sync-server start --path ./
```