/// elements to trigger events on
/// elements with index is for grabbin the i th element from querySelectorAll

// eslint-disable-next-line no-unused-vars
var elements =
{
  HoOriginal: {
    microphone:
    {
      'selector': '.IQ',
      'index': 0,
      'flag': '.IQ[aria-pressed="true"]' //flag = 'a-b-B';
    },
    camera:
    {
      'selector': '.OQ',
      'index': 0,
      'flag': '.OQ[aria-pressed="true"]'
    }
  },
  HoBeta: {
    microphone:
    {
      'selector': 'div[role="button"][jsname="gbbhzb"]',
      'index': 0,
      'flag': '.IQ[aria-pressed="true"]' //flag = 'U8OAre';
    },
    camera:
    {
      'selector': 'div[role="button"][jsname="YczAdf"]',
      'index': 0,
      'flag': '.YczAdf'
    }
  },
  Meet: {
    microphone:
    {
      'selector': 'div[role="button"][jsname="BOHaEe"]',
      'index': 0
    },
    camera:
    {
      'selector': 'div[role="button"][jsname="BOHaEe"]',
      'index': 1
    }
  }
}
