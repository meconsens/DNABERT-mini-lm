declare global {
    namespace NodeJS {
      interface ProcessEnv {
        ACME_SERVICE_CLIENT_ID: 'CY7u48AFjfRrs28LXMNGgyM';
        ACME_APP_ID: 'AFm8mvPu3tzM6r9jR72G4A6';
        NODE_ENV: 'development' | 'production';
      }
    }
  }
  
  // If this file has no import/export statements (i.e. is a script)
  // convert it into a module by adding an empty export statement.
  export {}