<div><img src="public/banner_logo.png" alt="CommunicALL Banner Logo" width="15%"></div>

# CommunicALL
***
> Note that this app was developed in about a semesters length, since this is a student project for a course at the university of Zürich. There's still a lot of rough edges in this project.

CommunicALL is our attempt at an accessibility focused video call client.
It allows for p2p video calling and supports a range of accessibility features, currently focused on deaf or hard of hearing users. These include text-to-speech, speech-to-text for hearing/deaf sessions, a chat with automatic time stamped messages, as well as automated transcripts for later use after a call has ended. As a further collaborative feature, a collaborative MD editor is present.

# UI and Functionalities
***
---to be added after UI redesign---

# Technologies
***
- [React](https://react.dev/) - Frontend Framework
- [SpringBoot](https://spring.io/projects/spring-boot/) - Backend Framework
- [Gradle](https://gradle.org/) - Dependency management
- [WebSpeechAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - STT/TTS support
- [WebRTC](webrtc.org/?hl=de) - P2P video streaming

# Getting Started
***
**Prerequisites :**
- Node.js 17+
- React
- Spring Boot backend running locally or cloud server
- Chrome (not guaranteed to work on other browser or limited functionality)
***
**Installation** -run a local dev server

1. Clone the repo
   `git clone https://github.com/LeonidWouters/sopra-fs26-group-06-client.git`
2. Navigate to the project, run
   `npm install`
3. Setup the dev environment if any changes are necessary
4. Run dev server
   `npm run dev`

**Visit:** [localhost://3000](localhost://3000)

# Deployment
***

The frontend is deployed to vercel through the workflow file in `.github/workflows/verceldeplosment.yml`
Pushing to main triggers the workflow, which releases a new build, please tag a new release as `v0.XX`.
The Vercel Deployment is configured via the vercel secrets in the repo.
Furthermore, a dockerbuild is automatically triggered. The container can be pulled from Dockerhub.

# Contributing
***
Contributions are welcome! If you find any part of our application useful, you may also integrate it into your own project, see the licensing section for more details.
For direct contributions, please follow the steps below:
1. If you are on Windows, please use WSL to run and develop the project
2. Fork the repository and create a new branch for your feature or bugfix, if you want to add a large feature, please create an issue first to discuss it with us
3. Make your changes and commit them with clear messages
4. Make a pull request to the main branch of this repository, describing your changes
5. Wait for a review and feedback

## Features
If you are looking for what to contribute, here are some ideas:
- Check the issues page for an open problems
- Add a true auth system, instead of using uuid tokens
- Make accessibility settings independent of the session, so that a user can store their preferences
- Add more accessibility features, such as screen reader support, color blindness modes

# License
***

This project is licensed under the GPL-3.0 License - see the COPYING file for details.


