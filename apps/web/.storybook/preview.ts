import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/index.css';

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        dark: '',
        light: 'light',
      },
      defaultTheme: 'dark',
    }),
  ],
};

export default preview;
