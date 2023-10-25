import axios, { AxiosResponse } from 'axios';
import * as semver from 'semver';

interface ReleaseInfo {
  tag_name: string;
  body: string;
}

interface VersionCheckResult {
  isNewVersionAvailable: boolean;
  message: string;
  releaseNotes: string;
}

export const checkGitHubRelease = async (
  repoOwner: string,
  repoName: string,
  currentVersion: string,
): Promise<VersionCheckResult> => {
  try {
    const response: AxiosResponse<ReleaseInfo> = await axios.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`,
    );

    if (response.status === 200) {
      const releaseInfo: ReleaseInfo = response.data;
      console.log(`Latest release version: ${releaseInfo.tag_name}`);
      console.log(`Current version: ${currentVersion}`);

      const comparisonResult: number = semver.compare(currentVersion, releaseInfo.tag_name);

      if (comparisonResult === -1) {
        return {
          isNewVersionAvailable: true,
          message: `A new version (${releaseInfo.tag_name}) is available.`,
          releaseNotes: releaseInfo.body,
        };
      } else if (comparisonResult === 0) {
        return {
          isNewVersionAvailable: false,
          message: 'You are using the latest version.',
          releaseNotes: releaseInfo.body,
        };
      } else {
        return {
          isNewVersionAvailable: false,
          message: 'You are using a newer version than the latest release.',
          releaseNotes: '',
        };
      }
    } else {
      return {
        isNewVersionAvailable: false,
        message: `Failed to fetch release information. Status code: ${response.status}`,
        releaseNotes: '',
      };
    }
  } catch (error) {
    return {
      isNewVersionAvailable: false,
      message: `Error occurred: ${error.message}`,
      releaseNotes: '',
    };
  }
};
