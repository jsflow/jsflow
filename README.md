JSFlow is an information flow aware JavaScript interpeter written in JavaScript.

# Installation 

jsflow is based on Node.js. It has been tested with Node.js version 14.16.1 and npm 6.14.12 and has been verified to work on Mac OS X 10.14, Ubuntu 20.04, Windows 10 using WSL1. 

To install first download all packages

        npm install

Thereafter use the Makefile to build Javascript files from the Typescript sources

        make

Alternatively, if you don't have make, use tsc directly from the node_modules directory

        ./node_modules/typescript/bin/tsc

# Running

Run jsflow via the jsflow Python script

        ./jsflow

The script requires Python 2.7 and you might have to change the name of the interpreter. If you want to run jsflow 
directly via Node.js, simply run


        node out/Toplevel/nodejs/NodeFlow.js

# Contributors

* Daniel Hedin
* Andrei Sabelfeld
* Alexander Sjösten

Former contributors:

* Arnar Birgisson
* Luciano Bello
