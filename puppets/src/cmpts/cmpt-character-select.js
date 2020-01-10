import React from 'react';
import { connect } from 'react-redux';
import {
  selectSprite,
  getSpriteList,
  drawSpriteToCanvas,
} from 'content/images';

const mapStateToProps = function(state) {
  return {
    spriteId: state.sprite.spriteId,
  };
};

class CharacterSelectCmpt extends React.Component {
  constructor(props) {
    super(props);
    this.canvases = {};
    getSpriteList().forEach(({ spriteId }) => {
      this.canvases[spriteId] = React.createRef();
    });
    this.handleSpriteClick = function(spriteId) {
      selectSprite(spriteId);
    };
  }

  componentDidMount() {
    for (let spriteId in this.canvases) {
      const ref = this.canvases[spriteId];
      drawSpriteToCanvas(spriteId + '_0', ref.current);
    }
  }

  isSpriteSelected(spriteId) {
    return this.props.spriteId === spriteId;
  }

  renderSpriteList() {
    const sprites = getSpriteList();
    let baseClassName = 'column-item column-item-centered';
    return sprites.map(({ spriteId }) => {
      let className = baseClassName;
      if (this.isSpriteSelected(spriteId)) {
        className += ' column-item-selected';
      }
      return (
        <div
          key={spriteId}
          className={className}
          onClick={this.handleSpriteClick.bind(this, spriteId)}
        >
          <canvas ref={this.canvases[spriteId]} width="64" height="64" />
        </div>
      );
    });
  }

  render() {
    return (
      <div className="column-right">
        <div className="column-title">Sprites</div>
        <div>{this.renderSpriteList()}</div>
      </div>
    );
  }
}

const EnhancedCharacterSelectCmpt = connect(
  mapStateToProps,
  null
)(CharacterSelectCmpt);

export default EnhancedCharacterSelectCmpt;
