'use strict';
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Q = require('q');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire');

var sandbox;

//// SUT

describe('MapperFirebase', function() {

  var onceSpy;
  var onceCallback;
  var onStoreChange;
  var mockFireBaseInstance;
  var MapperFirebase;
  var adaptor;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    onceSpy = sandbox.spy(function(type, cb){
      onceCallback = cb;
    });
    mockFireBaseInstance = {
      child: sandbox.spy(function() {
        return {
          once: onceSpy
        }
      }),
      on: sandbox.spy(function(event, cb) {
        onStoreChange = cb;
      })
    };
    MapperFirebase = proxyquire('../src/mapper-firebase', {
      'client-firebase': function(){
        return mockFireBaseInstance;
      }
    });
    adaptor = new MapperFirebase();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('once', function() {

    var promise;

    beforeEach(function() {
      promise = adaptor.once('test');
    });

    it('should return a Q promise', function() {
      expect(Q.isPromise(promise)).to.be.true;
    });

    it('should fetch the value from the store', function() {
      expect(mockFireBaseInstance.child).calledWith('test');
    });

    it('should bind once to the "value" event', function() {
      expect(onceSpy).calledWith('value');
    });

    describe('when resolved', function() {

      beforeEach(function() {
        onceCallback({
          val: function() {
            return '123';
          }
        })
      });

      it('should resolve the promise with the value', function(done) {
        promise.then(function(value) {
          expect(value).to.equal('123');
          done();
        });
      });

    });

  });

  describe('onChange', function() {

    var onChangeCallback;

    beforeEach(function() {
      onChangeCallback = sandbox.spy();
      adaptor.onChange(onChangeCallback);
    });

    it('should bind to the "child_changed" event', function() {
      expect(mockFireBaseInstance.on).calledWith('child_changed');
    });

    describe('when a change occurs', function() {

      beforeEach(function() {
        onStoreChange({
          name: function() {
            return 'name123';
          },
          val: function() {
            return 'val123';
          }
        });
      });

      it('should call the callback with the name and value', function() {
        expect(onChangeCallback).calledWith('name123', 'val123');
      });

    });

  });

});