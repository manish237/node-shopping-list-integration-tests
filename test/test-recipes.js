const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

// this lets us use *should* style syntax in our tests
// so we can do things like `(1 + 1).should.equal(2);`
// http://chaijs.com/api/bdd/
const should = chai.should();

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe('Recipe List', function() {

    before(function() {
        return runServer();
    });

    after(function() {
        return closeServer();
    });

    it('should list items on GET', function() {
        return chai.request(app)
            .get('/recipes')
            .then(function(res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');

                // because we create three items on app load
                res.body.length.should.be.at.least(1);
                // each item should be an object with key/value pairs
                // for `id`, `name` and `checked`.
                const expectedKeys = ['id', 'name', 'ingredients'];
                res.body.forEach(function(item) {
                    item.should.be.a('object');
                    item.should.include.keys(expectedKeys);
                    item.ingredients.should.be.a('array');
                });
            });
    });

    it('should add an item on POST', function() {
        const newItem = {name: 'milkshake',
            ingredients : ['2 tbsp cocoa', '2 cups vanilla ice cream', '1 cup milk']};
        return chai.request(app)
            .post('/recipes')
            .send(newItem)
            .then(function(res) {
                res.should.have.status(201);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.include.keys('id', 'name', 'ingredients');
                res.body.id.should.not.be.null;
                // response should be deep equal to `newItem` from above if we assign
                // `id` to it from `res.body.id`
                res.body.should.deep.equal(Object.assign(newItem, {id: res.body.id}));
            });
    });

    it('should not add an item missing mandatory field on POST', function() {
        const newItem = {ingredients : ['2 tbsp cocoa', '2 cups vanilla ice cream', '1 cup milk']};
        return chai.request(app)
            .post('/recipes')
            .send(newItem)
            .catch(function (err) {
                err.should.have.status(400);
            })
    });

    it('should update items on PUT', function() {
        const updateData = {
            name: 'foo',
            ingredients: ['2 tbsp cocoa', '2 cups vanilla ice cream', '1 cup milk']
        };

        return chai.request(app)
            .get('/recipes')
            .then(function(res) {
                updateData.id = res.body[0].id;
                return chai.request(app)
                    .put(`/recipes/${updateData.id}`)
                    .send(updateData);
            })
            // prove that the PUT request has right status code
            // and returns updated item
            .then(function(res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.deep.equal(updateData);
            });
    });

    it('should delete items on DELETE', function() {
        return chai.request(app)
            .get('/recipes')
            .then(function(res) {
                return chai.request(app)
                    .delete(`/recipes/${res.body[0].id}`);
            })
            .then(function(res) {
                res.should.have.status(204);
            });
    });
});