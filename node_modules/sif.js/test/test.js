//Require chai assert for test
var assert = require('chai').assert;

//Require SIF.js client 
var SIFJS = require('../');

var interactions = undefined;

describe('Test SIFJS client', function () {
    
    it('Exists and is called SIFJS', function () {
	   assert.isDefined(SIFJS);
    })
    
    describe('Parse empty string', function() {
        it('Interactions are defined', function () {
            interactions = SIFJS.parse('');
            assert.isDefined(interactions);
        })
        
        it('There are zero interactions', function () {
            assert.strictEqual(interactions.links.length, 0);
        })
        
        it('There are zero nodes', function () {
            assert.strictEqual(interactions.nodes.length, 0);
        })
    })
    
    describe('Parse interactions with space', function() {
        it('Interactions are defined', function () {
            interactions = SIFJS.parse('node1 xx node2\nnode1 xx node2\nnode1 yy node2');
            assert.isDefined(interactions);
        })
        
        it('There are two interactions', function () {
            assert.strictEqual(interactions.links.length, 2, 'should ignore one line');
        })
        
        it('There are two nodes', function () {
            assert.strictEqual(interactions.nodes.length, 2, 'should ignore one line');
        })
    })
    
    describe('Parse interactions with tab', function() {
        it('Interactions are defined', function () {
            interactions = SIFJS.parse('node1	xx	node2\nnode1	xx	node2\nnode1	yy	node2');
            assert.isDefined(interactions);
        })
        
        it('There are two interactions', function () {
            assert.strictEqual(interactions.links.length, 2, 'should ignore one line');
        })
        
        it('There are two nodes', function () {
            assert.strictEqual(interactions.nodes.length, 2, 'should ignore one line');
        })
    })
    
    describe('Parse multiple interactions in one line', function() {
        it('Interactions are defined', function () {
            interactions = SIFJS.parse('node1	xx	node2	node3	node4	node5\nnode1	xx	node2	node5\nnode1	yy	node2');
            assert.isDefined(interactions);
        })
        
        it('There are five iteractions', function () {
            assert.strictEqual(interactions.links.length, 5, 'should ignore one line');
        })
        
        it('There are five nodes', function () {
            assert.strictEqual(interactions.nodes.length, 5, 'should ignore one line');
        })
    })
});