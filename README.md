#### This is alpha. Do not use your production.

TypeScript Application for Serverless
===

A command line tool for AWS Lambda TypeScript function.

* Create AWS serverless project template (TypeScript, node).
* Manger parameters by AWS Systems Manager parameter store.
* Deploy Lambda Function using AWS SAM.

Installation
---
 
```bash
npm i -g tsas
```

Usage
---

```bash
tsas -h
---
Usage: tsas COMMAND

Commands:
  tsas init    Create a new, empty Typed Lambda project from a template.
  tsas param   Manage application parameters, [push|list]
  tsas deploy  Deploy aws resources, [serverless|sls|cloudformation|cfn]

Options:
  --version   Show version number                                      [boolean]
  --region    Use the indicated AWS region to override default in config file.
                                                                        [string]
  --env, -e   Environment name; such as dev, stg, prod...               [string]
  -h, --help  Show help                                                [boolean]
```

### Create project template.

```bash
mkdir hello-world
cd hello-world

tsas init
```

### Push parameters

`environments/${env}/parameters.json` has application parameters. This tool uses parameter store for CloudFormation deploy, so you should push local parameters to aws. 

```bash
tsas param push -e stg
tsas param list -e stg
```

#### Deploy lambda function

```bash
tsas deploy serverless -e stg 
```


Develop your application
---

### Edit parameters

`environments/${env}/parameters.json` has application parameters. If you want to add/modify parameters, edit the json file and re-push to parameter store, using:

```basj
tsas param push -e stg
``` 

### Lambda function 

`src/handlers` has lambda function entry point. So, you can start developing new functions by adding files to handlers. 
After that, edit `webpack.config.js` to entry new function.

```js
...
module.exports = {
    mode: 'development',
    target: 'node',
    entry: {
       'hello-world': path.resolve(__dirname, './src/lambda/handlers/hello/hello-world.ts'),

        // add
        'your-function': path.resolve(__dirname, './src/lambda/handlers/your/new-function.ts'), 
    },
```

