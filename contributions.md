# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

| **Student**        | **Date**   | **Link to Commit**                                                                                          | **Description**                                                                                                                        | **Relevance**                                                                                                                                                                                                                                                                                             |
|--------------------|------------|-------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **@LeonidWouters** | 23.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-server/issues/14                                       | First and last name are now part of user entity                                                                                        | This is relevant to be able to display the names of the users in the frontend                                                                                                                                                                                                                             |
| **@LeonidWouters** | 23.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-server/pull/19                                         | Upon logout of user, a new token is generated in the backend                                                                           | This is relevant to improve security. This ensures that a user cannot copy a token and use it for later sessions.                                                                                                                                                                                         |
| **@LeonidWouters** | 25.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-server/pull/26                                         | The notes files can be stored in the backend now. All endpoints are available and the rest specifications were testes via postman      | This is relevant to provide persistant files that users can access and edit.                                                                                                                                                                                                                              
| **@LeonidWouters** | 26.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-server/pull/28                                         | The transcript files can be stored in the backend now. All endpoints are available and the rest specifications were testes via postman | This is relevant to provide persistant transcripts that users can access. Currently it is implemented that PUT requests are not provided. If we want to enable changes/edits to the transcripts, we need to uncomment the respective parts of code in the transcript service, controller, dto and mapper. 
| **@somueller03**   | 23.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-server/pull/22                                         | Edit profile backend logic (new put endpoint and dto split)                                                                            | This is relevant to view and change his profile                                                                                                                                                                                                                                                           |
| **@somueller03**   | 24.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-client/pull/7                                          | Edit profile frontend (changes profile page, view/edit mode, own profile detection)                                                    | This is relevant to view and change his profile                                                                                                                                                                                                                                                           |
| **@tcaselas**      | 23.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-client/pull/3                                          | Implemented UI for Login and Registration Page                                                                                         | This is relevant because it allows a user to either log in with an existing account or create a new one                                                                                                                                                                                                   |
| **@RaffB05**       | 24.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-server/pull/24                                         | Adds Rooms to backend, which are built from a Hashmap upon server start                                                                | Core Room functionality in Backend, which allows users to join and leave rooms as well as the basis for writing transcripts and notes                                                                                                                                                                     |
| **@tcaselas**      | 26.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-client/pull/12                                         | Implemented Mainpage UI. User can now go tho his profile, logout or join a Room by clicking on "Join Room" for a predifined room.      | This is relevant so that as a user you have a overview of all available rooms and you can see if they are full empty or joinable. Then you can join a room.                                                                                                                                               |
| **@RaffB05**       | 27.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-server/commit/2c646b6a12ce612b11448b7580b74845a02bd12b | Adds Testing for Rooms                                                                                                                 | Ensures Room creation, modification and User Interaction are handled correctly                                                                                                                                                                                                                            |
| **@somueller03**   | 29.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-client/pull/17                                         | Frontend edit profile page new design (fitting to mainpage) and change password function                                               | This is relevant to view and change his profile / password                                                                                                                                                                                                                                                |
| **@somueller03**   | 29.03.2026 | https://github.com/LeonidWouters/sopra-fs26-group-06-server/pull/33                                         | implemented again 2 seperate endpoints and null check                                                                                  | This is relevant to view and change his profile / password                                                                                                                                                                                                                                                |

---

## Contributions Week 2 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                                                                                                                                       | **Relevance**                                                                                                                         |
|--------------------|----------|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| **@tcaselas**      | 30.03.26 | https://github.com/LeonidWouters/sopra-fs26-group-06-client/pull/22 | Implemented User Overview of all Users that are currently online on the Mainpage. Also feature to search for a user in a list of all registered users | This is important so that a user is able to see whos online so that he knows who he can call. Also to check out a other users profile |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task]                                                                                                                       | [Why this contribution is relevant]                                                                                                   |
| **[@githubUser2]** | [date]   | [Link to Commit 1] | [Brief description of the task]                                                                                                                       | [Why this contribution is relevant]                                                                                                   |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task]                                                                                                                       | [Why this contribution is relevant]                                                                                                   |
| **[@githubUser3]** | [date]   | [Link to Commit 1] | [Brief description of the task]                                                                                                                       | [Why this contribution is relevant]                                                                                                   |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task]                                                                                                                       | [Why this contribution is relevant]                                                                                                   |
| **[@githubUser4]** | [date]   | [Link to Commit 1] | [Brief description of the task]                                                                                                                       | [Why this contribution is relevant]                                                                                                   |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task]                                                                                                                       | [Why this contribution is relevant]                                                                                                   |

| **[@laurin10]** | [30.3.2026]   | [https://github.com/LeonidWouters/sopra-fs26-group-06-client/pull/27] 
| Added a "See latest transcripts/notes" button to the user profile page that navigates to a new transcripts page, where users can view and download their past video call transcripts and notes. 

| It allows users to access and review their past call transcripts and notes directly from their profil. |


|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |



---

## Contributions Week 3 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._
