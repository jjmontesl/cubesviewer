var path = require('path');

module.exports = {
  mode: 'development',
  entry: {
	  //cwd: path.resolve(__dirname, 'build'),
	  path: path.resolve(__dirname, 'cvcore/cvcore.js'),
  },
  resolve: {
      extensions: ['.js', '.scss'],
      modules: [
          'node_modules'
      ],
      alias: {
          //Application: path.resolve(__dirname,'../src/components/Application.jsx'),
          //Home: path.resolve(__dirname, '..src/components/Home.jsx'),
          //AppStyle: path.resolve(__dirname, '../src/styles/main.scss')
      }
  },
  output: {
	library: 'cvcore',  // makes it available as 'cubesviewer'
    path: path.resolve(__dirname, 'build'),
    filename: 'cvcore.js'
  }
};
