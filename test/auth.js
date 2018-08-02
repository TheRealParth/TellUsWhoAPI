/**
 * Created by deep on 3/10/17.
 */

//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server;
let should = chai.should();
var assert = require('assert');
var before = require("mocha/lib/mocha.js").before;

chai.use(chaiHttp);

before(function (done) {
    server = require("../bin/www");
    server.on('listening', function () {
        done();
    });
});

/**
 * Test the /auth/signup route
 */
describe('POST /auth/signup', () => {

    it('Asks for a valid phone number', (done) => {
        var post = {
            firstName: "Deep",
            lastName: "Patel",
            email: "deep7176@gmail.com",
            phone: "60952asl6",
            username: "stuff",
            password: "Things12!"
        };
        chai.request(server).post('/auth/signup')
            .send(post)
            .end((err, res) => {
                res.body.should.have.property('message');
                res.body.should.have.property('status');
                res.body.status.should.be.eql(202);
                done();
            });
    });

    it('asks for a valid email address', (done) => {
        var post = {
            firstName: "Deep",
            lastName: "Patel",
            email: "deep7176.com",
            phone: "+16095292926",
            username: "stuff",
            password: "Things12!"
        };
        chai.request(server).post('/auth/signup')
            .send(post)
            .end((err, res) => {
                res.body.should.have.property('message');
                res.body.should.have.property('status');
                res.body.status.should.be.eql(202);
                done();
            });
    });

    it('Signs up the user', (done) => {
        var post = {
            firstName: "Deep",
            lastName: "Patel",
            email: "deep7176@gmail.com",
            phone: "+16095292926",
            username: "stuff",
            password: "Things12!"
        };
        chai.request(server).post('/auth/signup')
            .send(post)
            .end((err, res) => {
                //;
                res.body.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('status');
                res.body.status.should.be.eql(200);
                var cookie = res.header['set-cookie'];
                done();
            });
    });


});

/**
 * Test the /auth/login route
 */
describe('POST /auth/login', () => {
    var cookie;
    it('login user', (done) => {
        var post = {
            username: "stuff",
            password: "Things12!"
        };
        chai.request(server).post('/auth/login')
            .send(post)
            .end((err, res) => {
                res.body.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('status');
                res.body.status.should.be.eql(200);
                res.body.message.should.be.eql('Signed in succesfully!');
                //res.body.should.have.object('user');
                //res.body.message.should.have.property('pages');
                cookie = res.header['set-cookie'];
                //;
                //;
                done();
            });
    });

    //checks to see if the user is logged in
    it('check if the user is logged in', (done) => {
        chai.request(server).get('/auth')
            .set('Cookie', cookie[0], cookie[1])
            .end((err, res) => {
                res.body.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('status');
                //res.body.user.should.be.a('object');
                //;
                done();
            });
    });
});

// /*
