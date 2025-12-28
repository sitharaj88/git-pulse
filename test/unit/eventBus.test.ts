import * as assert from 'assert';
import * as sinon from 'sinon';
import { EventBus, EventType } from '../../src/core/eventBus';

describe('EventBus Unit Tests', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('Event Emission', () => {
    it('should emit events', () => {
      const callback = sinon.stub();

      eventBus.on(EventType.RepositoryChanged, callback);
      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });

      assert.ok(callback.calledOnce);
      assert.ok(callback.calledWith({ path: '/test' }));
    });

    it('should emit events to multiple listeners', () => {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();

      eventBus.on(EventType.RepositoryChanged, callback1);
      eventBus.on(EventType.RepositoryChanged, callback2);
      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });

      assert.ok(callback1.calledOnce);
      assert.ok(callback2.calledOnce);
    });

    it('should emit different event types independently', () => {
      const repoCallback = sinon.stub();
      const diffCallback = sinon.stub();

      eventBus.on(EventType.RepositoryChanged, repoCallback);
      eventBus.on(EventType.DiffChanged, diffCallback);
      
      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });
      eventBus.emit(EventType.DiffChanged, { key: 'status' });

      assert.ok(repoCallback.calledOnce);
      assert.ok(diffCallback.calledOnce);
      assert.ok(repoCallback.calledWith({ path: '/test' }));
      assert.ok(diffCallback.calledWith({ key: 'status' }));
    });
  });

  describe('Event Subscription', () => {
    it('should return disposable from on()', () => {
      const callback = sinon.stub();
      const disposable = eventBus.on(EventType.RepositoryChanged, callback);

      assert.ok(disposable);
      assert.strictEqual(typeof disposable.dispose, 'function');
    });

    it('should unsubscribe when disposable is disposed', () => {
      const callback = sinon.stub();
      const disposable = eventBus.on(EventType.RepositoryChanged, callback);

      disposable.dispose();
      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });

      assert.ok(callback.notCalled);
    });

    it('should not affect other listeners when one is disposed', () => {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();
      const disposable1 = eventBus.on(EventType.RepositoryChanged, callback1);
      eventBus.on(EventType.RepositoryChanged, callback2);

      disposable1.dispose();
      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });

      assert.ok(callback1.notCalled);
      assert.ok(callback2.calledOnce);
    });
  });

  describe('Once Subscription', () => {
    it('should subscribe to event once', () => {
      const callback = sinon.stub();

      eventBus.once(EventType.RepositoryChanged, callback);
      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });
      eventBus.emit(EventType.RepositoryChanged, { path: '/test2' });

      assert.ok(callback.calledOnce);
    });

    it('should remove once handler after execution', () => {
      const callback = sinon.stub();

      eventBus.once(EventType.RepositoryChanged, callback);
      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });

      assert.strictEqual(eventBus.listenerCount(EventType.RepositoryChanged), 0);
    });
  });

  describe('Event Types', () => {
    it('should support RepositoryChanged event', () => {
      const callback = sinon.stub();
      eventBus.on(EventType.RepositoryChanged, callback);
      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });

      assert.ok(callback.calledOnce);
    });

    it('should support DiffChanged event', () => {
      const callback = sinon.stub();
      eventBus.on(EventType.DiffChanged, callback);
      eventBus.emit(EventType.DiffChanged, { key: 'status' });

      assert.ok(callback.calledOnce);
    });

    it('should support BranchCreated event', () => {
      const callback = sinon.stub();
      eventBus.on(EventType.BranchCreated, callback);
      eventBus.emit(EventType.BranchCreated, { branch: 'main' });

      assert.ok(callback.calledOnce);
    });

    it('should support CommitCreated event', () => {
      const callback = sinon.stub();
      eventBus.on(EventType.CommitCreated, callback);
      eventBus.emit(EventType.CommitCreated, { commit: 'abc123' });

      assert.ok(callback.calledOnce);
    });

    it('should support StashCreated event', () => {
      const callback = sinon.stub();
      eventBus.on(EventType.StashCreated, callback);
      eventBus.emit(EventType.StashCreated, { stash: 'stash@{0}' });

      assert.ok(callback.calledOnce);
    });

    it('should support RemoteUpdated event', () => {
      const callback = sinon.stub();
      eventBus.on(EventType.RemoteUpdated, callback);
      eventBus.emit(EventType.RemoteUpdated, { remote: 'origin' });

      assert.ok(callback.calledOnce);
    });

    it('should support RepositoryDetected event', () => {
      const callback = sinon.stub();
      eventBus.on(EventType.RepositoryDetected, callback);
      eventBus.emit(EventType.RepositoryDetected, { path: '/test', name: 'test' });

      assert.ok(callback.calledOnce);
    });

    it('should support ErrorOccurred event', () => {
      const callback = sinon.stub();
      eventBus.on(EventType.ErrorOccurred, callback);
      eventBus.emit(EventType.ErrorOccurred, { error: 'Test error' });

      assert.ok(callback.calledOnce);
    });
  });

  describe('Multiple Subscriptions', () => {
    it('should handle multiple subscriptions to same event', () => {
      const callbacks = Array(5).fill(null).map(() => sinon.stub());

      callbacks.forEach(cb => eventBus.on(EventType.RepositoryChanged, cb));
      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });

      callbacks.forEach(cb => assert.ok(cb.calledOnce));
    });

    it('should handle subscriptions to multiple events', () => {
      const repoCallback = sinon.stub();
      const diffCallback = sinon.stub();
      const branchCallback = sinon.stub();

      eventBus.on(EventType.RepositoryChanged, repoCallback);
      eventBus.on(EventType.DiffChanged, diffCallback);
      eventBus.on(EventType.BranchCreated, branchCallback);

      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });
      eventBus.emit(EventType.DiffChanged, { key: 'status' });
      eventBus.emit(EventType.BranchCreated, { branch: 'main' });

      assert.ok(repoCallback.calledOnce);
      assert.ok(diffCallback.calledOnce);
      assert.ok(branchCallback.calledOnce);
    });
  });

  describe('Event Data', () => {
    it('should pass event data to listeners', () => {
      const callback = sinon.stub();
      const testData = { path: '/test', name: 'test-repo' };

      eventBus.on(EventType.RepositoryDetected, callback);
      eventBus.emit(EventType.RepositoryDetected, testData);

      assert.ok(callback.calledWith(testData));
    });

    it('should handle complex event data', () => {
      const callback = sinon.stub();
      const testData = {
        repository: { path: '/test', name: 'test' },
        status: { files: [], staged: [], unstaged: [] }
      };

      eventBus.on(EventType.RepositoryChanged, callback);
      eventBus.emit(EventType.RepositoryChanged, testData);

      assert.ok(callback.calledWith(testData));
    });

    it('should handle null event data', () => {
      const callback = sinon.stub();

      eventBus.on(EventType.RepositoryChanged, callback);
      eventBus.emit(EventType.RepositoryChanged, null);

      assert.ok(callback.calledWith(null));
    });
  });

  describe('Listener Management', () => {
    it('should return correct listener count', () => {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();
      const callback3 = sinon.stub();

      eventBus.on(EventType.RepositoryChanged, callback1);
      eventBus.on(EventType.RepositoryChanged, callback2);
      eventBus.on(EventType.BranchCreated, callback3);

      assert.strictEqual(eventBus.listenerCount(EventType.RepositoryChanged), 2);
      assert.strictEqual(eventBus.listenerCount(EventType.BranchCreated), 1);
    });

    it('should check if event has listeners', () => {
      const callback = sinon.stub();

      assert.strictEqual(eventBus.hasListeners(EventType.RepositoryChanged), false);

      eventBus.on(EventType.RepositoryChanged, callback);

      assert.strictEqual(eventBus.hasListeners(EventType.RepositoryChanged), true);
    });

    it('should get all event types with listeners', () => {
      eventBus.on(EventType.RepositoryChanged, sinon.stub());
      eventBus.on(EventType.BranchCreated, sinon.stub());
      eventBus.on(EventType.CommitCreated, sinon.stub());

      const eventTypes = eventBus.getEventTypes();

      assert.strictEqual(eventTypes.length, 3);
      assert.ok(eventTypes.includes(EventType.RepositoryChanged));
      assert.ok(eventTypes.includes(EventType.BranchCreated));
      assert.ok(eventTypes.includes(EventType.CommitCreated));
    });
  });

  describe('Cleanup', () => {
    it('should clear specific event listeners', () => {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();

      eventBus.on(EventType.RepositoryChanged, callback1);
      eventBus.on(EventType.BranchCreated, callback2);

      eventBus.clear(EventType.RepositoryChanged);

      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });
      eventBus.emit(EventType.BranchCreated, { branch: 'main' });

      assert.ok(callback1.notCalled);
      assert.ok(callback2.calledOnce);
    });

    it('should clear all listeners', () => {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();
      const disposable1 = eventBus.on(EventType.RepositoryChanged, callback1);
      const disposable2 = eventBus.on(EventType.BranchCreated, callback2);

      eventBus.clearAll();

      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });
      eventBus.emit(EventType.BranchCreated, { branch: 'main' });

      assert.ok(callback1.notCalled);
      assert.ok(callback2.notCalled);
    });

    it('should dispose all listeners', () => {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();
      const disposable1 = eventBus.on(EventType.RepositoryChanged, callback1);
      const disposable2 = eventBus.on(EventType.BranchCreated, callback2);

      disposable1.dispose();
      disposable2.dispose();

      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });
      eventBus.emit(EventType.BranchCreated, { branch: 'main' });

      assert.ok(callback1.notCalled);
      assert.ok(callback2.notCalled);
    });

    it('should dispose EventBus', () => {
      eventBus.on(EventType.RepositoryChanged, sinon.stub());
      eventBus.on(EventType.BranchCreated, sinon.stub());

      eventBus.dispose();

      assert.strictEqual(eventBus.listenerCount(EventType.RepositoryChanged), 0);
      assert.strictEqual(eventBus.listenerCount(EventType.BranchCreated), 0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in event handlers', () => {
      const errorCallback = sinon.stub().throws(new Error('Test error'));
      const successCallback = sinon.stub();

      eventBus.on(EventType.RepositoryChanged, errorCallback);
      eventBus.on(EventType.RepositoryChanged, successCallback);

      eventBus.emit(EventType.RepositoryChanged, { path: '/test' });

      assert.ok(errorCallback.threw());
      assert.ok(successCallback.calledOnce);
    });
  });
});
