export const AUDIO_CONTEXT = new AudioContext();
autoUnlock(AUDIO_CONTEXT);

export const AUDIO_ASSET_TAG = 'audio';
export async function loadAudio(buffer, opts = {})
{
    const ctx = AUDIO_CONTEXT;
    let buf = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(buf).set(buffer);
    let data = await ctx.decodeAudioData(buf);
    return new Sound(ctx, data, Boolean(opts.loop));
}

const DEFAULT_SOURCE_PARAMS = {
    gain: 0,
    pitch: 0,
    pan: 0,
    loop: false,
};
class Sound
{
    constructor(ctx, audioBuffer, loop = false)
    {
        this.context = ctx;
        this.buffer = audioBuffer;

        this._source = null;

        this.playing = false;
        this.loop = loop;

        this.onAudioSourceEnded = this.onAudioSourceEnded.bind(this);
    }

    onAudioSourceEnded()
    {
        this._playing = false;
    }

    play(opts = DEFAULT_SOURCE_PARAMS)
    {
        if (!this.buffer) return;
        if (this._source) this.destroy();

        const ctx = this.context;
        let source = ctx.createBufferSource();
        source.addEventListener('ended', this.onAudioSourceEnded);
        source.buffer = this.buffer;
        source.loop = opts.loop;

        let prevNode = source;

        // https://www.oreilly.com/library/view/web-audio-api/9781449332679/ch04.html
        // Add pitch
        if (opts.pitch)
        {
            source.detune.value = opts.pitch * 100;
        }

        // Add gain
        if (opts.gain)
        {
            const gainNode = ctx.createGain();
            gainNode.gain.value = opts.gain;
            prevNode = prevNode.connect(gainNode);
        }

        // Add stereo pan
        if (opts.pan)
        {
            const pannerNode = ctx.createStereoPanner();
            pannerNode.pan.value = opts.pan;
            prevNode = prevNode.connect(pannerNode);
        }

        prevNode.connect(ctx.destination);
        source.start();

        this._source = source;
        this._playing = true;
    }

    pause()
    {
        this._source.stop();
        this._playing = false;
    }

    destroy()
    {
        if (this._source) this._source.disconnect();
        this._source = null;
    }
}

async function autoUnlock(ctx)
{
    const callback = () => {
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
    };
    document.addEventListener('click', callback);
}
