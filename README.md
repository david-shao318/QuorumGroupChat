# Quorum

A group chat with a _quorum_.

**React Native. Expo. Firebase and Cloud Firestore. Node.js.**

## Demo

Click the image below to see a [demo](https://youtu.be/44Xd-_JBUJs).

<a href="https://youtu.be/44Xd-_JBUJs" target="_blank"><img width="589" src="https://github.com/david-shao318/QuorumGroupChat/assets/57266876/8d8667cc-e5ff-4c91-b8d8-09b722b8bfd9"></a>

Messages are encrypted using a secret sharing scheme, divided up among all members of the group. Every user who sees a message contributes one _share_ to decrypt it. Once a _quorum_ of members have seen the message, it is automatically decrypted. As long as the _quorum_ remains online, the group conversation functions ordinarily.

This is a work-in-progress: many chat features are to be implemented.

## Algorithm

This project implements a version of Shamir's secret sharing, where a secret number $s$ is encrypted by constructing a polynomial $f$ over a finite field such that $f(0) = s$. Each share is a point $(x, f(x))$. With $k$ such shares, where $k$ is the degree of the polynomial, it is always possible to reconstruct the original polynomial $f$ by Lagrangian interpolation:

![image](https://wikimedia.org/api/rest_v1/media/math/render/svg/c592c649fc468bcf4b4881e5003b3de3586f2368)

It is necessary to work over a finite field for encryption, as over the reals, for instance, a partial reconstruction can occur in a way that eliminates possiblilities for $f$ with increasingly many shares. This implementation encrypts UTF-8 strings and produces hex-string shares, which are then displayed as UTF-8 strings, removing invalid or undisplayable characters.

## Installation

1. Install packages with `yarn install` in the main directory. Front-end chat UI builds on react-native-gifted-chat.
2. To run with Expo, use `yarn start`. In this state, you can switch between Expo Go and the included build for ios, and run ios, android, and web verions of the app.
3. To run as an app on physical ios devices, open the `ios` directory in Xcode as a project and build to a physical device. Note that changes made to the project should be followed with `yarn build:ios` to propagate to Xcode builds.

<img src="assets/splash.png" width="250"/>

#### License: MIT

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
