module.exports = {
    'rethinkdb': {
        'host': process.env.ADDRESS ? 'localhost' : 'resources.coo-e.com',
        'port': 28015,
        'authKey': '',
        'db': 'devTest'
    },
    'telluswhoDB': {
        'host' : process.env.ADDRESS ? 'localhost' : 'resources.coo-e.com',
        'port' : 28015,
        'db' :  'devTelluswho'
    },
    'redis' : {
      'host' : 'localhost'
    },
    'serverTelluswho': {
      'host' : process.env.ADDRESS ? 'localhost' : 'resources.coo-e.com',
      'port' : 28015,
      'db' :  'productionTelluswho'
    },
    'serverRethinkdb' : {
      'host': process.env.ADDRESS ? 'localhost' : 'resources.coo-e.com',
      'port': 28015,
      'authKey': '',
      'db': 'productionMain'
    },
    'sessionConfig' : {
      'name': 'connect.sig',
      'secret': 'ballsacks'
    },
    'facebookAuth': {
        'clientID': '802441529886221', // your App ID
        'clientSecret': '3a09e2e0087d09aa4b6462275a013e7b',
        'callbackURL': (process.env.ADDRESS || "localhost") + ':'+ (process.env.PORT || "3000") +'/auth/facebook/callback'
    },
    'googleAuth': {
        'clientID': '984631161614-78p3ts2jm40j0qpicv8d8aipbstahpdi.apps.googleusercontent.com',
        'clientSecret': 'bM5BefguQyEu_Om1A98t-Z40',
        'callbackURL': (process.env.ADDRESS || "localhost") + ':'+ (process.env.PORT || "3000") +'/auth/google/callback'
    },
    'regexPhone': "\\+[0-9]{11}$",
    'regexEmail' : "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-_]+\.[A-Za-z]{2,4}$"
};
