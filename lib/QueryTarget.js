class QueryTarget {
  static createNullTarget() {
    return new QueryTarget("", null);
  }

  constructor(targetString, targetClientRect) {
    this.targetString = targetString;
    this.targetClientRect = targetClientRect;
    this.createdTime = Date.now();
    this.isActive = false;
  }

  _isRectEqual(rect1, rect2) {
    if (rect1 == null || rect2 == null) {
      return false;
    }

    return (
      rect1.left == rect2.left &&
      rect1.right == rect2.right &&
      rect1.top == rect2.top &&
      rect1.bottom == rect2.bottom
    );
  }

  equalTo(ht) {
    return (
      this.isValid &&
      this.targetString === ht.targetString &&
      this._isRectEqual(this.targetClientRect, ht.targetClientRect)
    );
  }

  get isValid() {
    return isStringValid(this.targetString) && this.targetClientRect !== null;
  }

  get livingTime() {
    return Date.now() - this.createdTime;
  }

  toString() {
    return `${this.targetString} time: ${this.createdTime}, rect: ${this
      .targetClientRect && this.targetClientRect.toString()}`;
  }

  updateClientRect(rect) {
    this.targetClientRect = rect;
  }
}
