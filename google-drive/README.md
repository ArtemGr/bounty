# upload to google drive

Prototyping the access tokens and the automatic Google Drive uploads

The uploads are semi-automatic:  
We need to *manually* obtain the secret, and use it to generate the tokens and to upload the first version of a file.  
The tokens are used then to *automatically* update that file.

The tokens are limited to only update that existing file, allowing us to use them from a CI.

# step one: get secret

Start/open a Google Drive project [at the Google Console](http://console.developers.google.com/start/api?id=drive).

Create Google Drive OAuth 2.0 credentials. See [this codelabs walkthrough](https://codelabs.developers.google.com/codelabs/gsuite-apis-intro#6) for extra reference.

![Create OAuth client ID](https://i.imgur.com/iMcyCBU.png)

Use the “download JSON” link to get the “client_secret_….json”.

![Client ID for Desktop](https://i.imgur.com/R4AC1LB.png)

Note that [resetting the secret will only affect the token refresh](https://github.com/googleapis/google-api-dotnet-client/issues/1152#issuecomment-360501210). That is, there is a time window when the old tokens still work after a secret reset.

Place the obtained “client_secret_….json” into the “google-drive” folder here, next to “google-drive.js”.

# step two: generate tokens

TBD
