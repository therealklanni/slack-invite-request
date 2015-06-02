# Slack Invite Request (aka SIR)

![SIR](https://raw.githubusercontent.com/therealklanni/slack-invite-request/master/public/images/bot.png)

Fully-customizable webapp for generating invite requests to your private Slack 
team. Authenticates applicants via Google Sign-In and then displays form details 
submitted by the applicant by posting to a group/channel/user of your choice 
on Slack. 

The applicant will see the following pages in order:

1. `/` - provides some information about SIR and your Slack team
2. `/signin` - Google authentication
3. `/apply` - custom form to gather important details from the user
4. `/thanks` - thank the user for submitting and what to expect next
 
SIR makes use of [Handlebars](http://handlebarsjs.com/) templates and 
[Bootstrap](http://getbootstrap.com/) UI, so it's **mobile-friendly** out of 
the box and **highly-customizable**. Most static strings can be easily configured 
from a [YAML](http://www.yaml.org/start.html) config file, making quick edits a 
breeze even if you have no web development experience.

Deploying your SIR can be a little more complex, but Heroku takes most of the pain 
out of it. See below for more details.

## Installation

Clone the repository to your web server

Alternatively:

* Install via `npm install slack-invite-request`
* Download the [latest release](https://github.com/therealklanni/slack-invite-request/releases/latest)

Then, configure Nginx/Apache or [deploy to Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction).

## Configuration

### Google Client ID

To use this app, you will need a Google Developer Client ID. Visit the 
[Google Developer Console](https://console.developers.google.com) to set up a 
new project.

1. In the Developer Console, click `Add Project` to create a new project.
2. On the Project Dashboard, click `Enable an API` and turn on `Google+ API`
3. Click on `Credentials` on the left navigation (under "APIs and Auth")
4. Click on `Create new Client ID` under "OAuth"
5. Choose "Web application"
6. In the "Authorized JavaScript Origins" text box, enter your Hubot URL (e.g. http://myserver.com)
7. In the "Authorized Redirect URL" text box, enter "http://myserver.com/signin"
8. Copy the `ClientID` 

### Environment variables

These environment variables are required (with the exception of `SLACK_CHANNEL`) to enable the **Google SignIn** and **Slack** integrations. Make sure to set these before starting your server.

* `GA_TOKEN` - To track analytics on your SIR, create a Google Analytics token (set this to `X` if you don't want analytics)
* `GOOGLE_CLIENTID` - the Client ID from above
* `SLACK_WEBHOOK_URL` - obtained by adding a "Incoming Webhook" integration to your Slack team
* `SLACK_CHANNEL` - the destination for the request notifications; this can be a public #channel, private group, or a @username. (optional, for overriding the default channel in the Slack "Incoming Webhook" integration settings)
* `SLACK_BOT_NAME` - override the bot name (default: "SIR")

e.g., for Heroku you would run:

```sh
heroku config:set ENV_VARIABLE=value
```

### Strings

You can customize each page by modifying the `strings.yml` file.

The `strings.yml` file is set up as follows:

```yml
main:
  # ... strings for main and thanks pages ...
apply:
  # ... strings for application page ...
  header:
    # ... strings for the page header ...
  form:
    # ... form field configuration ...
signin:
  # ... strings for signin page ...
```

In the `apply.form` section, the `fullName` and `email` blocks should be
considered necessary for proper functionality of the app. However, you can
still customize these fields by editing these (and only these) properties: 

* `class` - classes to apply to this form input (use for CSS customization)
* `title` - the text that will appear above the input field
* `required` - set to `true` to make the field a required field (optional)
* `readonly` - set to `true` to disable changing the value (optional)
* `help` - additional description (optional)

In the `apply.form.custom` section, you can modify *any* of the values as you see
fit, or add/remove blocks, or even remove the `custom` section entirely, if
you like.

The default configuration should sufficiently provide varying examples of custom
field configurations. More advanced users can also modify the *view templates* 
themselves for even higher degree of customization. If you choose to do this,
please note that the `fullName` and `email` fields should still be considered 
necessary.

## Planned

- [ ] Redis (or possibly any other db) support
- [ ] Support other authentication platforms (OpenID Connect, etc)
- [ ] Admin page (track who you've already sent and invite to, etc) maybe?

***PRs accepted!***

## License

MIT © [Kevin Lanni](https://github.com/therealklanni)
