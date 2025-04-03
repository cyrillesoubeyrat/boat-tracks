class SpeedFactors {
    static X0_06 = 6;
    static X0_125 = 12;
    static X0_25 = 25;
    static X0_5 = 50;
    static X1 = 100;
    static X2 = 200;
    static X4 = 400;
    static X8 = 500;
    static X16 = 1000;
    static X32 = 2000;
    static X64 = 4000;

    constructor(name) {
        this.name = name;
    }
}

class FleetSpeedFactor {
  #speedFactors = [SpeedFactors.X0_06, SpeedFactors.X0_125, SpeedFactors.X0_25, SpeedFactors.X0_5, SpeedFactors.X1, SpeedFactors.X2, SpeedFactors.X4, SpeedFactors.X8, SpeedFactors.X16, SpeedFactors.X32, SpeedFactors.X64];
  #maxIdx = this.#speedFactors.length - 1;
  #minIdx = 0;
  #speedIdx = this.#speedFactors.indexOf(SpeedFactors.X1);

  reset() {
    this.#speedIdx = this.#speedFactors.indexOf(SpeedFactors.X1);
  }
  decrease() {
    if (this.#speedIdx != this.#minIdx) {
      this.#speedIdx--;
    }
    return this.#speedFactors[this.#speedIdx];
  }
  increase() {
    if (this.#speedIdx != this.#maxIdx) {
      this.#speedIdx++;
    }
    return this.#speedFactors[this.#speedIdx];
  }
  get value() {
    return this.#speedFactors[this.#speedIdx];
  }
}

export default FleetSpeedFactor;