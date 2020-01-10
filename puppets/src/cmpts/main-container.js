import React from 'react';
import SoundSelect from 'cmpts/cmpt-sound-select';
import { SoundPlayer } from 'cmpts/cmpt-sound-player';
import CharacterSelect from 'cmpts/cmpt-character-select';
import { AnimationArea } from 'cmpts/cmpt-animation-area';
import { CadenceMaker } from 'cmpts/cmpt-cadence-maker';
import { useWindowDimensions } from 'hooks';
import { connect } from 'react-redux';
import { getSound } from 'content/sounds';
import { urlToSoundName } from 'utils';

const mapStateToProps = function(state) {
  return {
    soundUrl: state.sound.soundUrl,
  };
};

const WithSound = connect(
  mapStateToProps,
  null
)(props => {
  const soundUrl = props.soundUrl;
  const soundName = urlToSoundName(soundUrl);
  const [sound, setSound] = React.useState(null);
  React.useEffect(() => {
    setSound(null);
    const _loadSound = async () => {
      const s = await getSound(soundName, soundUrl);
      setSound(s);
    };
    _loadSound();
  }, [soundUrl, soundName]);
  return props.children(sound);
});

export default () => {
  const dims = useWindowDimensions();
  return (
    <WithSound>
      {sound => {
        return (
          <div
            style={{
              display: 'flex',
              height: dims[1] + 'px',
            }}
          >
            <SoundSelect sound={sound} />
            <div className="middle-container">
              <AnimationArea sound={sound} />
              <SoundPlayer sound={sound} />
            </div>
            <CharacterSelect />
            <CadenceMaker sound={sound} />
          </div>
        );
      }}
    </WithSound>
  );
};
