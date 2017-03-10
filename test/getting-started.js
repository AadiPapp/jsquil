import { assert } from 'chai'
import { gates, inits, operations, Program, QVM } from '../index.js'

let p;
let q = new QVM();

describe('initial tests', () => {
  before(() => {
    p = new Program();
    p.inst(gates.X(0));
    p.measure(0, 0);
  });

  it('creates Quil program code', () => {
    assert.equal(p.code(), 'X 0\nMEASURE 0 [0]\n');
  });
  
  it('tells the QVM to run a program with one return value', function(done) {
    // return the zeroth classical register
    q.run(p, [0], 1, (err, returns) => {
      assert.equal(err, null);
      assert.equal(returns.length, 1);
      assert.equal(returns[0].length, 1);
      assert.equal(returns[0][0], 1);
      done();
    });
  });
  
  it('tells the QVM to run a program with three return values', function(done) {
    q.run(p, [0, 1, 2], 1, (err, returns) => {
      assert.equal(err, null);
      assert.equal(returns.length, 1);
      assert.equal(returns[0].length, 3);
      assert.equal(returns[0][0], 1);
      assert.equal(returns[0][1], 0);
      assert.equal(returns[0][2], 0);
      done();
    });
  });
});

describe('series of gates', () => {
  before(() => {
    p = new Program();
    p.inst(gates.X(0), gates.Y(1), gates.Z(0));
    p.measure(0, 1);
  });
  
  it('remembers all instructions', (done) => {
    assert.equal(p.code(), 'X 0\nY 1\nZ 0\nMEASURE 0 [1]\n');
    q.run(p, [0], 1, (err, returns) => {
      assert.equal(err, null);
      done();
    });
  });
});

describe('H gate', () => {
  before(() => {
    p = new Program();
    p.inst(gates.H(0));
    p.measure(0, 0);
  });

  it('tells the QVM to run a program ten times', (done) => {
    q.run(p, [0], 10, (err, returns) => {
      assert.equal(err, null);
      assert.equal(returns.length, 10);
      returns = returns.map((response) => {
        assert.equal(response.length, 1);
        return response[0];
      });
      assert.isAtLeast(returns.indexOf(0), 0);
      assert.isAtLeast(returns.indexOf(1), 0);
      done();
    });
  });
});


// defining gates?  not supported

// wavefunction() ?  not supported

describe('phase gates', () => {
  it('writes a good CPHASE instruction', () => {
    let c = gates.CPHASE(Math.PI / 2, 1, 2);
    assert.equal(c.code, 'CPHASE(1.5707963267948966) 1 2');
  });
});

describe('control flow', () => {
  it('embeds a program in a do-while loop', () => {
    p = new Program();
    p.inst(inits.TRUE([2]));
    let loop = new Program();
    loop.inst(gates.X(0));
    p.while_do(2, loop);
    p.inst(inits.FALSE([0]));
    assert.equal(p.code(), 'TRUE [2]\nLABEL @START1\nJUMP-UNLESS @END2 [2]\nX 0\nJUMP @START1\nLABEL @END2\nFALSE [0]\n');
  });
  
  it('embeds two programs in an if-then loop', () => {
    p = new Program();
    p.inst(inits.TRUE([2]));
    let thener = new Program();
    thener.inst(gates.X(0));
    let elser = new Program();
    elser.inst(gates.H(0));
    p.if_then(1, thener, elser);
    p.inst(inits.FALSE([0]));
    assert.equal(p.code(), 'TRUE [2]\nJUMP-WHEN @THEN3 [1]\nH 0\nJUMP @END4\nLABEL @THEN3\nX 0\nLABEL @END4\nFALSE [0]\n');
  });
});