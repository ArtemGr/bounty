## create your access token

https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token

## config settings.js
```
module.exports = {
    ghtoken:    ''  ,    //your github token
    ghrepo:     ''  ,     //example ghrepo :'sp0t/test-create-issue'
    ghissue:    1   ,      //set your git issue id for update https://github.com/sp0t/create-issue-test/issues/(github issue id)
}
``` 

## open your terminal and run these commands
```    
    npm i
    npm run create
    npm run update
```
