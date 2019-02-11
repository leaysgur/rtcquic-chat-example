const { Peer } = window;

export class Signaling {
  init() {
    this.peer = new Peer({ key: 'ccffa51f-63c0-47bb-afc5-07d3749325bd' });
  }
}
